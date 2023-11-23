import { WechatyBuilder } from "wechaty";
import qrcodeTerminal from "qrcode-terminal";
import config from "./config.js";

let bot: any = {};
let qrcodeCache: any = {};
let startTime = new Date();
initProject();

function onScan(qrcode) {
  if (qrcodeCache !== qrcode) {
    qrcodeCache = qrcode;
    qrcodeTerminal.generate(qrcode, { small: true }); // Show QR Code in Console
    const qrcodeImageUrl = [
      "https://api.qrserver.com/v1/create-qr-code/?data=",
      encodeURIComponent(qrcode),
    ].join("");
    console.log(qrcodeImageUrl);
  }
}

async function onLogin(user) {
  qrcodeCache = null;
  startTime = new Date();
  console.log(`${user} has logged in at: ${startTime}`);
}

function onLogout(user) {
  console.log(`${user} has logged out at: ${new Date()}`);
}

function onError(e) {
  console.log(`bot error: ${e}`);
}

async function onMessage(msg) {
  // Skip Msg in the past
  if (msg.date() < startTime) {
    return;
  }
  // Skip Msg for yourself
  if (msg.self()) {
    return;
  }

  // Room
  const room = msg.room();
  const roomId = room && room.id;
  const topic = room && await room.topic();
  // Talker
  const contact = msg.talker();
  const talker = (await contact.alias()) || (await contact.name());
  const talkerId = contact.id;
  // Msg
  const content = msg.text().trim();
  const msgType = msg.type();
  const isText = msgType === bot.Message.Type.Text;
  // RedEnvelope
  const RedEnvelope = "收到紅包，請在手機上查看。";
  const Transfer = "[收到一条微信转账消息，请在手机上查看]"
  const isRedEnvelope = content == RedEnvelope;
  const isTransfer = content == Transfer;
  if (isRedEnvelope || isTransfer) {
    console.log(`----------- ??? RedEnvelope pattern ??? -----------`);
  } else if (msgType === bot.Message.Type.Image)  {
    console.log(`----------- ??? Image ??? -----------`);
  }

  // Msg Handler
  if (room && isText) {
    console.log(`${topic} >> ${talker} >> ${content}`);

    const pattern = RegExp(`^@[\\w\\W]*\\s+${config.groupKey}[\\s]*`);
    if (await msg.mentionSelf()) {
      if (pattern.test(content) || config.groupKey === "") {
        const groupContent = content.replace(pattern, "");
        console.log("----------- Catch Group Content -----------");
        room.say(`${talker}: ${groupContent}\n-----------\nGroup name: ${topic}\nCatch Group Content`)
        return;
      }
    }
  } else if (isText) {
    console.log(`${talker} >> ${content}`);

    const pattern = RegExp(`^${config.privateKey}`);
    if (pattern.test(content) || config.privateKey === "") {
      const privateContent = content.replace(pattern, "");
      console.log("----------- Catch Private Content -----------");
      contact.say(`${talker}: ${privateContent}\n-----------\nCatch Private Content`)
    }
  } else {
    const logContent = msgType === bot.Message.Type.Unknown && content;
    console.log(`----------- Unhandle Msg ${msgType} ${bot.Message.Type[msgType]}: ${topic} >> ${talker} >> ${logContent} -----------`);
  }
}

async function initProject() {
  try {
    bot = WechatyBuilder.build({
      name: "WechatEveryDay",
      puppet: "wechaty-puppet-wechat",
      puppetOptions: {
        uos: true,
      },
    });

    bot
      .on("scan", onScan)
      .on("login", onLogin)
      .on("logout", onLogout)
      .on("message", onMessage)
      .on("error", onError);

    bot
      .start()
      .then(() => console.log("Start to log in wechat..."))
      .catch((e) => console.error(`catch error: ${e}`));
  } catch (error) {
    console.log("init error: ", error);
  }
}

// Msg Type: {
//   "0":"Unknown",
//   "1":"Attachment",
//   "2":"Audio",
//   "3":"Contact",
//   "4":"ChatHistory",
//   "5":"Emoticon",
//   "6":"Image",
//   "7":"Text",
//   "8":"Location",
//   "9":"MiniProgram",
//   "10":"GroupNote",
//   "11":"Transfer",
//   "12":"RedEnvelope",
//   "13":"Recalled",
//   "14":"Url",
//   "15":"Video",
//   "16":"Post",}


