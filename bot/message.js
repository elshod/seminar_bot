const { bot } = require('./bot')
const User = require('../model/user')


const { start, requestContact } = require('./helper/start')
const {get_all_users} = require('./helper/users')
const {
  get_all_categories,
  new_category,
  save_category,
} = require('./helper/category');

const {add_product_next} = require('./helper/product')


bot.on('message', async msg => {
    const chatId = msg.from.id
    const text = msg.text 
    console.log(text)
    const user = await User.findOne({chatId}).lean()

    if (text === '/start'){
        start(msg)
    }

    if (user){
        if (user.action === 'request_contact' && !user.phone)
            requestContact(msg)

        
        // if (user.action == 'new_product_title'){
        //     add_product_next(chatId,text,'title')
        // }
        // if (user.action == 'new_product_price'){
        //     add_product_next(chatId,text,'price')
        // }
        // if (user.action == 'new_product_text'){
        //     add_product_next(chatId,text,'text')
        // }

        

        if (text === 'Foydalanuvchilar'){
            get_all_users(msg)
            return
        }
        
        if (text === 'Katalog'){
            get_all_categories(chatId);
            return
        }

        if (user.action === 'add_category'){
            new_category(msg)
        }

        if (user.action.includes('edit_category-')){
            save_category(chatId,text)
        }

        if (user.action.includes('new_product_') && user.action !== 'new_product_img'){
            add_product_next(chatId,text,user.action.split('_')[2])
        }

        if (user.action == 'new_product_img'){
            if (msg.photo){
                add_product_next(chatId,msg.photo.at(-1).file_id,'img')
            } else {
                bot.sendMessage(chatId,'Mahsulot rasmini oddiy rasm ko`rinish yuklang')
            }
        }
        
    }

    

    // if ()
})

