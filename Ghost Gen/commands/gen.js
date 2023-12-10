// Gereksinimler
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

// Fonksiyonlar
const log = new CatLoggr();
const generated = new Set();

module.exports = {
    name: 'gen', // Komut adı
    description: 'Eğer mevcutsa istenen hesabı gönderir', // Komut açıklaması

    /**
     * Komutu çalıştırır
     * @param {Message} message Kullanıcı tarafından gönderilen mesaj
     * @param {Array[]} args Komut adından sonra boşlukla ayrılan argümanlar
     */
    execute(message, args) {
        // Eğer yapılandırmada belirtilen genel kanal geçerli değilse veya belirtilmediyse
        try {
            message.client.channels.cache.get(config.genChannel).id; // Kanalın kimliğini almaya çalış
        } catch (error) {
            if (error) log.error(error); // Eğer bir hata oluştuysa, konsola kaydet

            // "error_message" alanı yapılandırmada "true" olarak belirtilmişse hata mesajını gönder
            if (config.command.error_message === true) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('**Hata oluştu!**')
                        .setDescription('<a:ghost_no:1156683548678434946> `Geçerli bir genel kanal belirtilmedi!`')
                        .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                );
            } else return;
        };

        // Eğer mesajın kanal kimliği yapılandırmadaki genel kanal kimliğine eşitse
        if (message.channel.id === config.genChannel) {
            // Kullanıcının komuta bekleme süresi varsa
            if (generated.has(message.author.id)) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('**Erişilemez.**')
                        .setDescription(`:stopwatch: __Bir süre beklemelisin :)__ **${config.genCooldownsec}**`)
                        .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                );
            } else {
                // Parametreler
                const service = args[0];

                // Eğer "service" parametresi eksikse
                if (!service) {
                    return message.channel.send(
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('**Eksik parametreler!**')
                            .setDescription('__Bir hizmet adı vermelisiniz!__ \n <a:ghost_dia:1156703800363581462> `Örnek: .gen valorant`')
                            .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                            .setTimestamp()
                    );
                };

                // Hizmet dosyasının yolu
                const filePath = `${__dirname}/../stock/${args[0]}.txt`;

                // Hizmet dosyasını oku
                fs.readFile(filePath, function (error, data) {
                    // Hata yoksa
                    if (!error) {
                        data = data.toString(); // İçeriği metin haline getir

                        const position = data.toString().indexOf('\n'); // Pozisyonu al
                        const firstLine = data.split('\n')[0]; // İlk satırı al

                        // Hizmet dosyası boşsa
                        if (position === -1) {
                            return message.channel.send(
                                new MessageEmbed()
                                    .setColor(config.color.red)
                                    .setTitle('**Oluşturucu hatası!**')
                                    .setDescription(`<a:ghost_uyari:1157790781545918516> **Stokta** \`${args[0]}\` **hizmeti bulunmamaktadır.**`)
                                    .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                    .setTimestamp()
                            );
                        }

                        // Kullanıcıya mesaj gönder
                        const embedMessage = new MessageEmbed()
                            .setColor(config.color.green)
                            .setTitle('<a:ghost_parlak:1158470957078429808> **Oluşturulan hesap** <a:ghost_parlak:1158470957078429808>')
                            .addField('Hizmet', `\`\`\`${args[0][0].toUpperCase()}${args[0].slice(1).toLowerCase()}\`\`\``, true)
                            .addField('Hesap', `\`\`\`${firstLine}\`\`\``, true)
                            .setTimestamp();

                        message.author.send(`> <a:ghost_yes:1156683590881521705> **Hesap Oluşturuldu**`);
                        message.author.send(embedMessage).then((dmMessage) => {
                            const logChannel = message.client.channels.cache.get('1179445459547336845'); // Hedef log kanalının ID'sini buraya girin

                            logChannel.send(
                                new MessageEmbed(embedMessage)
                                    .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                            );
                        });

                        // Eğer kullanıcı mesajı aldıysa kanala mesaj gönder
                        if (position !== -1) {
                            data = data.substr(position + 1); // Oluşturulan hesap satırını kaldır

                            fs.writeFile(filePath, data, function (error) {
                                message.channel.send(
                                    new MessageEmbed()
                                        .setColor(config.color.green)
                                        .setTitle('<a:ghost_tadas:1159537971071033556> **Hesap Oluşturuldu**')
                                        .setDescription(`<a:ghost_dia:1156703800363581462> DM kutuna bak **${message.author}!** *DM Mesajlarını açmayı unutma*`)
                                        .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                        .setTimestamp()
                                )
                                .then((sentMessage) => {
                                    setTimeout(() => {
                                    sentMessage.delete();
                                }, 6000000); // 6 saniye sonra sil (6000 milisaniye)
                                });
                            });

                            generated.add(message.author.id); // Kullanıcıyı bekleme setine ekle

                            // Bekleme süresini ayarla
                            setTimeout(() => {
                                generated.delete(message.author.id); // Süre dolduktan sonra kullanıcıyı bekleme setinden çıkar
                            }, config.genCooldown);

                            if (error) return log.error(error); // Eğer bir hata oluştuysa, konsola kaydet
                        }
                        else {
                            // Hizmet boşsa
                            return message.channel.send(
                                new MessageEmbed()
                                    .setColor(config.color.red)
                                    .setTitle('Oluşturucu hatası!')
                                    .setDescription(`\`${args[0]}\` hizmeti stokta yok!`)
                                    .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                    .setTimestamp()
                            );
                        }
                    } else {
                        // Hizmet mevcut değilse
                        return message.channel.send(
                            new MessageEmbed()
                                .setColor(config.color.red)
                                .setTitle('Oluşturucu hatası')
                                .setDescription(`\`${args[0]}\` böyle bir hizmet yok`)
                                .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                .setTimestamp()
                        );
                    }
                });
            }
        } else {
            // Komut başka bir kanalda kullanılıyorsa
            message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Yanlış komut kullanımı!')
                    .setDescription('Bu komutu bu kanalda kullanamazsınız! <#' + config.genChannel + '> kanalında deneyin.')
                    .setFooter(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
            );
        }
    },
};
