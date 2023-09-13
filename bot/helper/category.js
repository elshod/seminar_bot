const { bot } = require('../bot');
const User = require('../../model/user');
const Category = require('../../model/category');
const Product = require('../../model/product');

const { adminKeyboard, userKeyboard } = require('../menu/keyboard');

const get_all_categories = async (chatId, page = 1) => {
  let user = await User.findOne({ chatId }).lean();
  let limit = 5;
  let skip = (page - 1) * limit;
  if (page == 1) {
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: 'category-1' },
      { new: true }
    );
  }
  let categories = await Category.find().skip(skip).limit(limit).lean();
  if (categories.length == 0) {
    page--
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: `category-${page}` },
      { new: true }
    );
    console.log('page', page, user.action);
    get_all_categories(chatId, page);
    return;
  }

  let list = categories.map((category) => [
    {
      text: category.title,
      callback_data: `category_${category._id}`,
    },
  ]);

  bot.sendMessage(chatId, 'Kategoriyalar ro`yhati', {
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: [
        ...list,
        [
          {
            text: 'Ortga',
            callback_data: page > 1 ? 'back_category' : page,
          },
          {
            text: page,
            callback_data: '0',
          },
          {
            text: 'Keyingi',
            callback_data: limit == categories.length ? 'next_category' : page,
          },
        ],
        user.admin
          ? [
              {
                text: 'Yangi kategoriya',
                callback_data: 'add_category',
              },
            ]
          : [],
      ],
    },
  });
};

const add_category = async (chatId) => {
  let user = await User.findOne({ chatId }).lean();

  if (user.admin) {
    await User.findByIdAndUpdate(
      user._id,
      {
        ...user,
        action: 'add_category',
      },
      { new: true }
    );

    bot.sendMessage(chatId, 'Yangi kategoriya nomini kiriting');
  } else {
    bot.sendMessage(chatId, 'Sizga bunday so`rov mumkin emas!');
  }
};

const new_category = async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;

  let user = await User.findOne({ chatId }).lean();

  if (user.admin && user.action === 'add_category') {
    // console.log(text);
    let newCategory = new Category({
      title: text,
    });
    await newCategory.save();
    await User.findByIdAndUpdate(user._id, {
      ...user,
      action: 'category',
    });
    get_all_categories(chatId);
  } else {
    bot.sendMessage(chatId, 'Sizga bunday so`rov mumkin emas!');
  }
};

const pagination_category = async (chatId, action) => {
  let user = await User.findOne({ chatId }).lean();
  let page = 1;
  if (user.action.includes('category-')) {
    page = +user.action.split('-')[1];
    // console.log(page)
    if (action == 'back_category' && page > 1) {
      page--;
    }
  }
  if (action == 'next_category') {
    page++;
  }
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `category-${page}` },
    { new: true }
  );
  get_all_categories(chatId, page);
};

const show_category = async (chatId, id, page = 1) => {
  let category = await Category.findById(id).lean();
  let user = await User.findOne({ chatId }).lean();
  await User.findByIdAndUpdate(
    user._id,
    { ...user, action: `category_${category._id}` },
    { new: true }
  );
  let limit = 5;
  let skip = (page - 1) * limit;
  let products = await Product.find({ category: category._id })
    .skip(skip)
    .limit(limit)
    .lean();
  let list = products.map((product) => [
    {
      text: product.title,
      callback_data: `product_${product._id}`,
    },
  ]);
  const userKeyboards = [];
  const adminKeyboards = [
    [
      {
        text: 'Yangi mahsulot',
        callback_data: `add_product_${category._id}`,
      },
    ],
    [
      {
        text: 'Turkumni tahrirlash',
        callback_data: `edit_category-${category._id}`,
      },
      {
        text: 'Turkumni o`chirish',
        callback_data: `del_category-${category._id}`,
      },
    ],
  ];
  const keyboards = user.admin ? adminKeyboards : userKeyboards;

  bot.sendMessage(
    chatId,
    `${category.title} turkumidagi mahsulotlar ro'yhati`,
    {
      reply_markup: {
        remove_keyboard: true,
        inline_keyboard: [
          ...list,
          [
            {
              text: 'Ortga',
              callback_data: page > 1 ? 'back_product' : page,
            },
            {
              text: page,
              callback_data: '0',
            },
            {
              text: 'Keyingi',
              callback_data: limit == products.length ? 'next_product' : page,
            },
          ],
          ...keyboards,
        ],
      },
    }
  );
};

const remove_category = async (chatId, id) => {
  let user = await User.findOne({ chatId }).lean();
  let category = await Category.findById(id).lean();
  if (user.action !== 'del_category') {
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: 'del_category' },
      { new: true }
    );
    bot.sendMessage(
      chatId,
      `Siz ${category.title} turkumni o'chirmoqchisiz. Qaroringiz qat'iymi?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Bekor qilish',
                callback_data: `category_${category._id}`,
              },
              {
                text: 'O`chirish',
                callback_data: `del_category-${category._id}`,
              },
            ],
          ],
        },
      }
    );
  } else {
    let products = await Product.find({ category: category._id })
      .select(['_id'])
      .lean();

    await Promise.all(
      products.map(async (product) => {
        await Product.findByIdAndRemove(product._id);
      })
    );

    await Category.findByIdAndRemove(id);

    bot.sendMessage(
      chatId,
      `${category.title} turkumi o'chirildi.
Menyudan tanlang`
    );

    // await Product.findByIdAndRemove
  }
}

const edit_category = async (chatId,id) => {
    let user = await User.findOne({chatId}).lean()
    let category = await Category.findById(id).lean()

    await User.findByIdAndUpdate(user._id,{...user,action:`edit_category-${id}`},{new:true})

    bot.sendMessage(chatId,`${category.title} turkumga yangi nom bering`)

}

const save_category = async (chatId,title) => {
    let user = await User.findOne({chatId}).lean()
    await User.findByIdAndUpdate(user._id,{...user,action:'menu'},{new:true})
    let id = user.action.split('-')[1]
    let category = await Category.findById(id).lean()
    await Category.findByIdAndUpdate(id,{...category,title},{new:true})
    bot.sendMessage(chatId,`Turkum yangilandi.\nMenyudan tanlang`)
}

module.exports = {
  get_all_categories,
  add_category,
  new_category,
  pagination_category,
  show_category,
  remove_category,
  edit_category,
  save_category,
};
