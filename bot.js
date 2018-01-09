const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client({ fetchAllMembers: false, apiRequestMethod: 'sequential' });
client.on('ready', () => { client.user.setGame('$test | V1.0'); });
client.login(process.env.BOT_TOKEN).then(() => console.log(`${client.user.tag} (${client.user.id}) ismi ile giriş yapıldı.`))
client.on('ready', () => { console.log("BOT: Şu an " + client.channels.size + " adet kanala ve " + client.guilds.size + " adet sunucuya hizmet veriliyor!"); });
const connections = new Map();
let broadcast;




client.on('message', m => {
  if (!m.guild) return;
  if (m.content.startsWith('$gir')) {
    const channel = m.guild.channels.get(m.content.split(' ')[1]) || m.member.voiceChannel;
    if (channel && channel.type === 'voice') {
      channel.join().then(conn => {
	  if (m.member.hasPermission("MANAGE_MESSAGES")) {
        conn.player.on('error', (...e) => console.log('player', ...e));
        if (!connections.has(m.guild.id)) connections.set(m.guild.id, { conn, queue: [] });
        m.reply('Tamamdır!');
	  }
      });
    } else {
      m.reply('Lütfen bir sesli kanala giriniz!');
    }
  } else if (m.content.startsWith('$çal')) {
    if (connections.has(m.guild.id)) {
	if (m.member.hasPermission("MANAGE_MESSAGES")) {
      const connData = connections.get(m.guild.id);
      const queue = connData.queue;
      const url = m.content.split(' ').slice(1).join(' ')
        .replace(/</g, '')
        .replace(/>/g, '');
      queue.push({ url, m });
      if (queue.length > 1) {
        m.reply(`İstediğiniz müzik ${queue.length - 1} adet müzikten sonra çalacak`);
        return;
	  }
      
      doQueue(connData);
    }
	}
  } else if (m.content.startsWith('$geç')) {
	if (m.member.hasPermission("MANAGE_MESSAGES")) {
    if (connections.has(m.guild.id)) {
      const connData = connections.get(m.guild.id);
      if (connData.dispatcher) {
        connData.dispatcher.end();
		m.reply(`Müzik başarı ile geçildi/durduruldu`);
      }
    }
	}
  } else if (m.content.startsWith('$kuyruk')) {
    if (connections.has(m.guild.id)) {
      const connData = connections.get(m.guild.id);
      const queue = connData.queue;
      m.reply(queue.map(q => q.url));
    }
  }
  else if (m.content.startsWith('$yardım')) {
  m.author.send(`$gir > Botun müzik kanalına girmesini sağlar [DJ]`)
  m.author.send(`$çal [youtubeurl] > Müzik çalmayı sağlar [DJ]`)
  m.author.send(`$geç > Çalan müziği geçmenizi veya durdurmanızı sağlar [DJ]`)
  m.author.send(`$kuyruk > Müzik sırasını gösterir`)
  m.reply(`Özel mesajlarını kontrol et :mailbox:`);
  }
});


function doQueue(connData) {
  const conn = connData.conn;
  const queue = connData.queue;
  const item = queue[0];
  if (!item) return;
  const stream = ytdl(item.url, { filter: 'audioonly' }, { passes: 3 });
  const dispatcher = conn.playStream(stream);
  stream.on('info', info => {
    item.m.reply(`Çalınan: **${info.title}**`);
	console.log(`Bir kanalda şu şarkı çaldı: ${info.title}`);
  });
  dispatcher.on('end', () => {
    queue.shift();
    doQueue(connData);
  });
  dispatcher.on('error', (...e) => console.log('dispatcher', ...e));
  connData.dispatcher = dispatcher;
}
