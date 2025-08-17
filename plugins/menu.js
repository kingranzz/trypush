async function menu(sock, sender, message) {
  const templates = `*✯ ᴍᴇɴᴜ ꜱᴄ ᴊᴘᴍ ✯*

➽ ʟɪꜱᴛɢᴄ
➽ ᴀᴜᴛᴏᴊᴘᴍ
➽ ᴀᴜᴛᴏʀᴇᴘʟʏ
➽ ᴊᴘᴍ
➽ ᴊᴘᴍᴛᴀɢ
➽ ᴘᴜꜱʜᴋᴏɴᴛᴀᴋ

ᴄᴏᴘʏʀɪɢʜᴛ © autoresbot.com
`;
  await sock.sendMessage(sender, { text: templates });
}

module.exports = menu;
