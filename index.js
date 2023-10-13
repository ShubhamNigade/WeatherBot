const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config();

const axios = require("axios");
const appID = process.env.openapi;


const weatherEndpoint = (city) =>
  `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${appID}`;

const cron = require("node-cron");

const cronSchedule = "* 9 * * *"; 

const startCronJobs = () => {
  cron.schedule(cronSchedule, () => {
    sendWeatherUpdates();
  
  });
  
}

const token = process.env.token;

const bot = new TelegramBot(token, {
  polling: true,
});

bot.on("polling_error", (msg) => console.log(msg));
startCronJobs();
bot.onText(/\/weather/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
  
  };
  bot.sendMessage(chatId, "Please enter the City ", opts);
  bot.once("message", (nextMsg) => {
    const city = nextMsg.text;
    getWeather(bot, msg.chat.id, city);
    
  });
});


bot.on("callback_query", function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    reply_to_message_id: msg.message_id,
    message_id: msg.message_id,
  };


  if (action === "getName") {
    bot.once("message", (nextMsg) => {
      const city = nextMsg.text;
      getWeather(bot, msg.chat.id, city);
      
    });
    bot.sendMessage(msg.chat.id, "Please enter the city name.");
  }
});


const weatherHtmlTemplate = (name, main, weather, wind, clouds) =>
  `The Weather Report of <b>${name}</b>:
<b>${weather.main}</b> - ${weather.description}
Temperature: <b>${main.temp} °C</b>
Pressure: <b>${main.pressure} hPa</b>
Humidity: <b>${main.humidity} %</b>
Wind: <b>${wind.speed} meter/sec</b>
Clouds: <b>${clouds.all} %</b>
`;

const getWeather = async (bot,chatId, city) => {
  const endpoint = weatherEndpoint(city);

  try {
    const resp = await axios.get(endpoint);
    const { name, main, weather, wind, clouds } = resp.data;
   
    bot.sendMessage(
      chatId,
      weatherHtmlTemplate(name, main, weather[0], wind, clouds),
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.log("error", error);
    bot.sendMessage(
      chatId,
      `I was unable to get the weather report. for <b>${city}</b>`,
      { parse_mode: "HTML" }
    );
  }
};



bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "You are now subscribed");
});


module.exports = {
  startCronJobs,
  getWeather
};