async function send(sock, sender, message, key, messageEvent) {
  console.log("Pengiriman Pesan ke :", sender);
  const msg = `Tes Pengiriman Pesan Sukses`;
  await sock.sendMessage(sender, { text: msg });
}

module.exports = send;
