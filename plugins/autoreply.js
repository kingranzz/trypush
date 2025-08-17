let status = false;

// Fungsi untuk reset counter per grup
function resetChatCounter(sender) {
  if (global.chatCounter[sender]) {
    global.chatCounter[sender].total = 0;
    //console.log('✅ Total chat untuk grup ini telah direset');
  } else {
    //console.log('⚠️ Grup belum memiliki data counter');
  }
}

// Fungsi utama
async function autoreply(sock, sender, messages, key, messageEvent) {
  // Jika sudah berjalan, hentikan duplikasi interval
  if (status) {
    await sock.sendMessage(sender, {
      text: "✅ Autoreply sudah berjalan sebelumnya",
    });
    return;
  }

  // Validasi isi pesan
  const parts = messages.trim().split(" ");
  if (parts.length < 2) {
    return sock.sendMessage(sender, {
      text: `*ᴄᴀʀᴀ ᴘᴇɴɢɢᴜɴᴀᴀɴ*\n➽ ᴀᴜᴛᴏʀᴇᴘʟʏ ᴛᴇxᴛ\n\nᴄᴏɴᴛᴏʜ: ᴀᴜᴛᴏʀᴇᴘʟʏ ᴘᴇꜱᴀɴ`,
    });
  }
  status = true;

  // Interval kirim pesan ke grup aktif setiap 10 detik (misal)
  const interval = setInterval(async () => {
    const activeGroups = Object.keys(global.chatCounter || {});

    if (activeGroups.length === 0) {
      console.log("⛔ Tidak ada grup aktif. Menunggu aktivitas...");
      return;
    }

    const text = parts.slice(1).join(" ");
    if (!text) {
      return sock.sendMessage(sender, { react: { text: "🚫", key } });
    }

    await sock.sendMessage(sender, { react: { text: "⏰", key } });

    for (const groupId of activeGroups) {
      try {
        if (global.chatCounter[groupId]?.total < 1) continue;

        await sock.sendMessage(groupId, {
          text: text,
        });

        console.log(`✅ Terkirim ke ${groupId}`);
        resetChatCounter(groupId);

        // Tunggu antar kiriman
        await new Promise((resolve) =>
          setTimeout(resolve, global.jeda || 10000)
        ); // default 10s
      } catch (err) {
        console.error(`❌ Gagal kirim ke ${groupId}:`, err.message);
      }
    }
  }, 60 * 1000); // Jalankan setiap 1 menit (looping utama)
}

module.exports = autoreply;
