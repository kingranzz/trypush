const clc = require("cli-color");
const fs = require("fs");
const path = require("path");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const {
  saveAutoJPMStatus,
  readAutoJPMStatus,
} = require("../lib/autojpmStatus");

global.autojpmRunning = false;

async function getAllGroups(sock) {
  try {
    const groups = await sock.groupFetchAllParticipating();
    return Object.values(groups).map((group) => ({
      id: group.id,
      name: group.subject,
      participants: group.participants,
    }));
  } catch (error) {
    console.error(clc.red("❌ Gagal mengambil grup:"), error);
    return [];
  }
}

async function autojpm(sock, sender, messages, key, messageEvent) {
  const {
    isImageMessage,
    downloadAndSaveMedia,
    readWhitelist,
  } = require("../lib/utils");

  const parts = messages.trim().split(" ");
  const command = parts[0]?.toLowerCase();
  const text = parts.slice(1).join(" ").trim();

  // Jika perintah adalah "autojpm stop"
  if (text === "stop") {
    if (!global.autojpmRunning) {
      console.log("❌ AutoJPM tidak sedang berjalan.");
      return sock.sendMessage(sender, {
        text: "❌ AutoJPM tidak sedang berjalan.",
      });
    }
    global.autojpmRunning = false;
    saveAutoJPMStatus(false); // Simpan status stop
    console.log("🛑 AutoJPM telah dihentikan oleh pengguna.");
    return sock.sendMessage(sender, { text: "🛑 AutoJPM telah dihentikan." });
  }

  // Cegah duplikat
  if (global.autojpmRunning) {
    return sock.sendMessage(sender, {
      text: "⚠️ AutoJPM sudah berjalan. Ketik *autojpm stop* untuk menghentikan.",
    });
  }

  if (!text) {
    return sock.sendMessage(sender, {
      text: `*ᴄᴀʀᴀ ᴘᴇɴɢɢᴜɴᴀᴀɴ*\n➽ ᴀᴜᴛᴏᴊᴘᴍ ᴛᴇxᴛ\n\nᴄᴏɴᴛᴏʜ: ᴀᴜᴛᴏᴊᴘᴍ ᴘᴇꜱᴀɴ`,
    });
  }

  global.autojpmRunning = true;

  let imagePath = null;

  if (isImageMessage(messageEvent)) {
    try {
      const filename = `${sender}.jpeg`;
      const result = await downloadAndSaveMedia(
        sock,
        messageEvent.messages?.[0],
        filename
      );
      if (result) imagePath = `./tmp/${filename}`;
    } catch (error) {
      console.error(clc.red("❌ Error saat mengunduh gambar:"), error);
    }
  }

  saveAutoJPMStatus(true, text, imagePath);

  await sock.sendMessage(sender, { react: { text: "⏰", key } });

  let putaran = 1;
  while (global.autojpmRunning) {
    const allGroups = await getAllGroups(sock);
    if (!allGroups.length) {
      await sock.sendMessage(sender, { text: "❌ Tidak ada grup ditemukan." });
      break;
    }

    const whitelist = readWhitelist();
    const targetGroups = whitelist
      ? allGroups.filter((group) => !whitelist.includes(group.id))
      : allGroups;

    if (targetGroups.length === 0) {
      await sock.sendMessage(sender, {
        text: "⚠️ Semua grup ada di whitelist. Tidak ada target untuk dikirim pesan.",
      });
      break;
    }

    let groupCount = 1;
    for (const group of targetGroups) {
      if (!global.autojpmRunning) break;

      const participants = Array.isArray(group?.participants)
        ? group.participants
        : [];
      const mentions = global.autojpm.hideTag
        ? participants.map((p) => p.id)
        : [];

      console.log(
        clc.green(
          `AUTOJPM [${groupCount}/${targetGroups.length}] Kirim ke grup: ${group.name}`
        )
      );

      try {
        await Promise.race([
          sock.sendMessage(
            group.id,
            imagePath
              ? { image: fs.readFileSync(imagePath), caption: text, mentions }
              : { text, mentions }
          ),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout saat kirim pesan")),
              10000
            )
          ),
        ]);
      } catch (error) {
        console.error(clc.red(`❌ Gagal mengirim ke ${group.name}:`), error);
      }

      await sleep(global.jeda || 5000);
      groupCount++;
    }

    if (!global.autojpmRunning) break;

    console.log(
      clc.yellow(`🔁 Selesai ${putaran} putaran. Menunggu sebelum ulang...\n`)
    );
    putaran++;
    await sleep(global.autojpm.jedaPutaran || 20000); // 20 detik jeda antar putaran
  }

  global.autojpmRunning = false;
  await sock.sendMessage(sender, {
    text: "✅ AutoJPM selesai atau dihentikan.",
  });
}

module.exports = autojpm;
