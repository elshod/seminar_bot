const { bot } = require('./bot');
const User = require('../model/user');
const {
  add_category,
  pagination_category,
  show_category,
  remove_category,
  edit_category,
  get_all_categories,
} = require('./helper/category');

const {
  delete_product,
  add_product,
  show_product,
} = require('./helper/product');

const { ready_order, change_order, showlocation } = require('./helper/order');

bot.on('callback_query', async (query) => {
  const message_id = query.message.message_id;
  const { data } = query;
  const chatId = query.from.id;
  let id = data.split('-');

  bot
    .answerCallbackQuery(query.id, {
      cache_time: 0.5,
    })
    .then(() => {
      if (data === 'add_category') {
        add_category(chatId);
      }

      if (data.includes('map_order-')) {
        return showlocation(chatId, id[1]);
      }

      if (data.includes('success_order-')) {
        change_order(chatId, id[1], 2);
        return;
      }

      if (data.includes('cancel_order-')) {
        change_order(chatId, id[1], 3);
        return;
      }
      if (data.includes('order-')) {
        bot.deleteMessage(chatId, message_id);
        ready_order(chatId, id[1], id[2]);
      }

      if (data.includes('more_count-')) {
        show_product(chatId, id[1], +id[2] + 1, message_id);
      }
      if (data.includes('less_count-')) {
        if (id[2] > 1) {
          show_product(chatId, id[1], +id[2] - 1, message_id);
        }
      }
      if (['next_category', 'back_category'].includes(data)) {
        pagination_category(chatId, data, message_id);
      }
      if (data.includes('del_category-')) {
        remove_category(chatId, id[1]);
      }
      if (data.includes('edit_category-')) {
        edit_category(chatId, id[1]);
      }
      if (data.includes('add_product-')) {
        bot.deleteMessage(chatId, message_id);
        add_product(chatId, id[1]);
      }

      if (data.includes('del_product-')) {
        delete_product(chatId, id[1]);
      }

      if (data.includes('rem_product-')) {
        delete_product(chatId, id[1], true);
      }

      id = data.split('_');
      if (data.includes('category_')) {
        show_category(chatId, id[1], 1, message_id);
      }
      if (data.includes('product_')) {
        bot.deleteMessage(chatId, message_id);
        show_product(chatId, id[1]);
      }

      if (data === 'catalog') {
        get_all_categories(chatId);
      }
    }).catch(e => {
      console.log(e)
    })
});
