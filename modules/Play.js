const { MessageButton } = require("gcommands");
const ytdl = require("ytdl-core");

module.exports = async (client, guild, member, textChannel, video, isSkipped, presetVolume, isNew) => new Promise(async (res) => {
  let connection;
  try {
    connection = await member.voice.channel.join();
  } catch {
    return "음성채널에 있지 않아요!"
  }

  guild.me.voice.setSelfDeaf(true);
  connection.on("disconnect", () => {
    client.music.queue[guild.id] = [];
    client.music.data[guild.id].isPlaying = false;
    client.music.playing[guild.id] = {};
  });

  let data = {
    connection,
    channel: member.voice.channel,
    textChannel: textChannel,
    video,
    index: video.index,
    request: video.request,
    playedAt: Date.now()
  }
  video.playedAt = data.playedAt
  client.music.playing[guild.id] = data;
  client.music.data[guild.id].isPlaying = true;

  let stream = await ytdl(`https://www.youtube.com/watch?v=${video.id}`);
  let streamType = "opus";

  let dispatcher = connection
    .play(stream)
    .on("finish", () => {
      let willSkip = client.music.data[guild.id].skipQueue;
      if(client.music.data[guild.id].loop && !willSkip) {
        require("./Play.js")(client, guild, member, textChannel, video, true, dispatcher.volumeLogarithmic);
        return;
      }
      if (willSkip) data.index--;
      if (!client.music.queue[guild.id][data.index + 1]) {
        client.music.data[guild.id].skipQueue = false;
        client.music.data[guild.id].isPlaying = false;
        data.index = -1;
        client.music.playing[guild.id] = data;
      } else {
        require("./Play.js")(client, guild, member, textChannel, client.music.queue[guild.id][data.index + 1], false, dispatcher.volumeLogarithmic);
      }
    })
    .on("error", err => {
            let nextSong = client.music.queue[guild.id][data.index + 1];
      let msg = `• 음악 재생을 예약할꺠요! **${video.title}**${nextSong ? ". 스킵했어요!" : ""}`;
      res(msg);
      if (!isNew) textChannel.send(msg);
      if (nextSong) {
        require("./Play.js")(client, guild, member, textChannel, nextSong, false, dispatcher.volumeLogarithmic);
      }
    });

  res();

  dispatcher.setVolumeLogarithmic(presetVolume || 1);

  if (!isSkipped) textChannel.send(`• 음악을 재생할꺠요! **${video.title}**`)

  res();
});