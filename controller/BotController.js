const sqlite3 = require('sqlite3').verbose();
const { Controller, Response } = require("pepesan");
const f = require("../utils/Formatter");
const { join } = require('path');
const fs = require("fs");
const path = require("path");
const moment = require('moment-timezone');

module.exports = class BotController extends Controller {
  constructor(request) {
    super(request);

    // Inisialisasi koneksi ke database SQLite
    this.db = new sqlite3.Database(
      "data.sqlite",
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error("Error connecting to SQLite database:", err);
        } else {
          console.log("Connected to SQLite database");
        }
      }
    );

    // Membuat tabel jika belum ada
    this.db.run(`
      CREATE TABLE IF NOT EXISTS slip_gaji_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT,
        point1 INTEGER,
        point2 INTEGER,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Function introduction, menunjukkan pesan pengantar
  async introduction(request) {
    const number = request.number;
    this.db.get(
      `SELECT * FROM slip_gaji_requests WHERE number = ?`,
      [number],
      (err, row) => {
        if (err) {
          console.error("Error during SELECT:", err.message);
          return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
        }

        if(row){
          if (row.nik && row.nik.trim() !== "") {
            const input = request.text;
            if (!isNaN(input) && input.length === 6) {

              this.db.run(
                `DELETE FROM slip_gaji_requests WHERE nik = ?`,
                [row.nik],
                (updateErr) => {
                  if (updateErr) {
                    console.error(updateErr);
                    return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                  } else {
                    const fileName = row.nik + request.text;
                    const filePath = `public/${request.text}/${fileName}.pdf`;
                    // Periksa apakah file ada
                    if (fs.existsSync(filePath)) {
                      // Jika file ada, kirim file dan pesan konfirmasi
                      this.reply(Response.document.fromURL(filePath, 'application/pdf', ""));
                      this.reply("Ini ya slip gaji kamu periode ini...\nKalau ada pertanyaan masalah gaji bisa datang ke kantor SPM ya..\nTerima kasih😊🙏");
                      
                      // Waktu saat ini dalam format WIB
                      const currentTimeWIB = moment().tz('Asia/Jakarta');  // Menggunakan timezone Asia/Jakarta untuk WIB
                      // Waktu 7 jam yang lalu di WIB
                      const timeThresholdWIB = currentTimeWIB.subtract(7, 'hours').format('YYYY-MM-DD HH:mm:ss');
                      // Query untuk menghapus data yang lebih dari 7 jam
                      db.run('DELETE FROM user_history WHERE time < ?', [timeThresholdWIB]);
                    } else {
                      // Jika file tidak ada, kirim pesan pemberitahuan
                      this.reply(`Maaf, slip gaji kamu periode ini belum tersedia. Silakan cek kembali nanti atau hubungi kantor SPM untuk informasi lebih lanjut. 😊🙏`);
                    }
                  }
                });
            }else{
              const searchTerm = row.nik;

              // Kirim data ke URL menggunakan fetch
              const url = `https://script.google.com/macros/s/AKfycbzOm2jBYzRAWFsu-9DAf0m1mmOxh8goD1oiJ90lzLtwIcqh29UU957sJ-Woy1ymMWg4/exec?searchTerm=${encodeURIComponent(searchTerm)}`;

              fetch(url)
                .then((response) => response.json()) // Konversi respons menjadi JSON
                .then((data) => {
                  // Cek apakah response memiliki key success = true
                  if (data.success) {
                    // Jika success = true
                    const userName = data.results[0][3];
                    this.reply(`Mau ambil slip gaji periode berapa ${userName}?`);

                    // Ambil elemen pertama dari array di results[0]
                    const parsedResult = data.results[0][0]; // "BONDVAST"
                    
                    // Gabungkan dengan sheetName
                    const combinedData = `${data.sheetName} ${parsedResult}`;

                    // Gunakan hasil penggabungan sebagai parameter untuk URL kedua
                    const secondUrl = `https://script.google.com/macros/s/AKfycbxQuzA53DMw4vlgXYOgiQUCh-jqip-Rdqx8QGB7gj-1JtMAbDNzEgGnuk2tGSIob_o/exec?sheetName=${encodeURIComponent(combinedData)}`;
                    
                    // Kirim request ke URL kedua
                    fetch(secondUrl)
                      .then((secondResponse) => secondResponse.json())
                      .then((secondData) => {
                        // Loop untuk membuat pesan dengan nomor dan bulan
                        const message = secondData.results
                        .map((result, index) => `Ketik angka *${result[1]}* untuk gaji periode: ${result[0]}`) // result[0] adalah nama bulan
                        .join("\n");

                        // Balas dengan pesan yang sudah dibuat
                        this.reply(message);
                      })
                      .catch((error) => {
                        return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                      });

                  } else {
                    // Jika success = false
                    this.reply("Tolong masukkan NIK KTP yang valid berupa angka 16 digit ya...🥺🙏");
                  }
                })
                .catch((error) => {
                  // Tangani error
                  return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                });
            }
          } else {
            // Ambil data dari request.text
            const input = request.text;
    
            // Cek apakah input adalah angka dan panjangnya 16
            if (!isNaN(input) && input.length === 16) {
              // Ambil nilai dari request.text
              const searchTerm = request.text;
  
              // Kirim data ke URL menggunakan fetch
              const url = `https://script.google.com/macros/s/AKfycbzOm2jBYzRAWFsu-9DAf0m1mmOxh8goD1oiJ90lzLtwIcqh29UU957sJ-Woy1ymMWg4/exec?searchTerm=${encodeURIComponent(searchTerm)}`;
              fetch(url)
                .then((response) => response.json()) // Konversi respons menjadi JSON
                .then((data) => {
                  // Cek apakah response memiliki key success = true
                  if (data.success) {
                    this.db.run(
                      `UPDATE slip_gaji_requests SET nik = ? WHERE number = ?`,
                      [input, number],
                      (updateErr) => {
                        if (updateErr) {
                          console.error(updateErr);
                          return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                        } else {
                          const userName = data.results[0][3];
                          this.reply(`Mau ambil slip gaji periode berapa ${userName}?`);

                          // Ambil elemen pertama dari array di results[0]
                          const parsedResult = data.results[0][0]; // "BONDVAST"
                          
                          // Gabungkan dengan sheetName
                          const combinedData = `${data.sheetName} ${parsedResult}`;

                          // Gunakan hasil penggabungan sebagai parameter untuk URL kedua
                          const secondUrl = `https://script.google.com/macros/s/AKfycbxQuzA53DMw4vlgXYOgiQUCh-jqip-Rdqx8QGB7gj-1JtMAbDNzEgGnuk2tGSIob_o/exec?sheetName=${encodeURIComponent(combinedData)}`;
                          
                          // Kirim request ke URL kedua
                          fetch(secondUrl)
                            .then((secondResponse) => secondResponse.json())
                            .then((secondData) => {
                              // Loop untuk membuat pesan dengan nomor dan bulan
                              const message = secondData.results
                              .map((result, index) => `Ketik angka *${result[1]}* untuk gaji periode: ${result[0]}`) // result[0] adalah nama bulan
                              .join("\n");

                              // Balas dengan pesan yang sudah dibuat
                              this.reply(message);
                            })
                            .catch((error) => {
                              return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                            });
                        }
                      }
                    );
                  } else {
                    // Jika success = false
                    this.reply("Waduh... \nNIK KTP yang kamu masukkan tidak terdaftar😭 \nPastikan kamu sudah memasukkn NIK KTP yang benar ya...🥺🙏");
                  }
                })
                .catch((error) => {
                  // Tangani error
                  return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                });
            } else {
              // Jika input bukan angka atau panjangnya tidak 16
              this.reply("Tolong masukkan NIK KTP yang valid berupa angka 16 digit ya...🥺🙏");
            }
          }
        }else{
          const number = request.number;
          this.db.get(
            `SELECT * FROM user_history WHERE id = ?`,
            [number],
            (err, row) => {
              if(row){
                return this.reply(
                  Response.menu.fromArrayOfString(
                    [
                      f("menu.tentangKantor"),
                      f("menu.daftarRekening"),
                      f("menu.slipGaji")
                    ],
                    f("intro", [request.name]),
                    f("template.menu")
                  )
                );
              }else{
                const now = new Date();
                // Mendapatkan UTC offset dalam menit (misalnya untuk WIB adalah 7 jam atau 420 menit)
                const wibOffset = 7 * 60;
                // Mengubah waktu UTC ke WIB
                now.setMinutes(now.getMinutes() + wibOffset);
                // Menampung waktu WIB dalam format YYYY-MM-DD HH:mm:ss
                const time = now.toISOString().replace('T', ' ').slice(0, 19);
                this.db.run(
                  `INSERT INTO user_history (id, time) VALUES (?, ?)`,
                  [number, time],
                  (err) => {
                    this.reply(Response.image.fromURL("public/spmbotlogo.webp", `*Halo ${request.name}🖐!* \nSelamat datang di SPMBOT, senang bisa berjumpa denganmu❤`))
                    .then(() => {
                      // Kirim balasan kedua setelah balasan pertama selesai
                      return this.reply(
                        Response.menu.fromArrayOfString(
                          [
                            f("menu.tentangKantor"),
                            f("menu.daftarRekening"),
                            f("menu.slipGaji")
                          ],
                          f("intro", [request.name]),
                          f("template.menu")
                        )
                      );
                    })
                  }
                )
              }
          })
        }
      }
    );
  }

  // Function untuk memberikan informasi tentang kantor
  async tentangKantor(request) {
    await this.reply(Response.image.fromURL("public/officeIntro.png", "*PT. SIANTAR PUTRA MANDIRI (PT.SPM)* merupakan perusahaan outsourching yang menyediakan jasa penyalur tenaga kerja ke barbagai perusahaan yang bekerja sama dengan kami"));
    await this.reply(Response.image.fromURL("public/officePhoto.jpg", "PT. SIANTAR PUTRA MANDIRI berlokasi di Jl. Masjid Sukorejo No.60, RT.10/RW.03, Sukorejo, Lolawang, Kec. Ngoro, Kabupaten Mojokerto, Jawa Timur 61385"));
    await this.reply("Google Maps: https://maps.app.goo.gl/TVmjRcvApQxBoUgi6");
  }

  // Function untuk menampilkan informasi pendaftaran rekening
  async daftarRekening(request) {
    return Response.image.fromURL("public/qr.png", "*Kamu ingin melakukan pendaftaran rekening ya...*\n\nKalo gitu isi formulir pada link dibawah ini dengan benar dan lengkap atau scan barcode diatas yaa..\nhttps://forms.gle/rpMdtMLB9wHGV9AS7");
  }

  // Function untuk menangani permintaan slip gaji
  async slipGaji(request) {
    const number = request.number; // Anggap text berisi NIK
    const point1 = 1;

     // Cek apakah NIK sudah ada di database
    this.db.get(
      `SELECT * FROM slip_gaji_requests WHERE number = ?`,
      [number],
      (err, row) => {
        if (err) {
          console.error("Error during SELECT:", err.message);
          return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi yaa...");
        }

        if (row) {
          // Jika NIK sudah ada
          const searchTerm = row.nik;
          // Kirim data ke URL menggunakan fetch
          const url = `https://script.google.com/macros/s/AKfycbzOm2jBYzRAWFsu-9DAf0m1mmOxh8goD1oiJ90lzLtwIcqh29UU957sJ-Woy1ymMWg4/exec?searchTerm=${encodeURIComponent(searchTerm)}`;

          fetch(url)
            .then((response) => response.json()) // Konversi respons menjadi JSON
            .then((data) => {
              // Cek apakah response memiliki key success = true
              if (data.success) {
                // Jika success = true
                const userName = data.results[0][3];
                this.reply(`Mau ambil slip gaji periode berapa ${userName}?`);

                // Ambil elemen pertama dari array di results[0]
                const parsedResult = data.results[0][0]; // "BONDVAST"
                
                // Gabungkan dengan sheetName
                const combinedData = `${data.sheetName} ${parsedResult}`;

                // Gunakan hasil penggabungan sebagai parameter untuk URL kedua
                const secondUrl = `https://script.google.com/macros/s/AKfycbxQuzA53DMw4vlgXYOgiQUCh-jqip-Rdqx8QGB7gj-1JtMAbDNzEgGnuk2tGSIob_o/exec?sheetName=${encodeURIComponent(combinedData)}`;
                
                // Kirim request ke URL kedua
                fetch(secondUrl)
                  .then((secondResponse) => secondResponse.json())
                  .then((secondData) => {
                    // Loop untuk membuat pesan dengan nomor dan bulan
                    const message = secondData.results
                    .map((result, index) => `Ketik angka *${result[1]}* untuk gaji periode: ${result[0]}`) // result[0] adalah nama bulan
                    .join("\n");

                    // Balas dengan pesan yang sudah dibuat
                    this.reply(message);
                  })
                  .catch((error) => {
                    return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
                  });

              } else {
                // Jika success = false
                this.reply("Tolong masukkan NIK KTP yang valid berupa angka 16 digit ya...🥺🙏");
              }
            })
            .catch((error) => {
              // Tangani error
              return this.reply("Waduh... maaf aku lagi bingung🙏😵, silakan coba lagi ya...");
            });

        } else {
          // Jika NIK belum ada, lakukan INSERT
          this.db.run(
            `INSERT INTO slip_gaji_requests (number, point1) VALUES (?, ?)`,
            [number, point1],
            (err) => {
              if (err) {
                console.error("Error during INSERT:", err.message);
                this.reply("Waduh... maaf aku lagi bingung🙏😵, \nUlangi lagi prosesnya ya... \n(*Ketik angka 3 lagi*)");
              } else {
                this.reply("Ketikkan NIK KTP kamu yaa...");
              }
            }
          );
        }
      }
    );








































































































































































































































































































































































  }

  // Function untuk mengirimkan slip gaji dalam bentuk PDF
  async sendSlipGaji() {
    const fs = require('fs');
    const fileBuffer = fs.readFileSync('./public/cv.pdf');
    return this.reply(
      Response.document.fromBuffer(fileBuffer, "application/pdf", "Slip Gaji")
    );
  }
}
