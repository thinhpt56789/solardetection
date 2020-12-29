const { Client } = require('pg');

const pool = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1',
    port: 5432,
});

pool.connect();


// Các hàm bên dưới sẽ được gọi từ file "server.js"

// Hàm này sẽ lưu giá trị đo được 
exports.querySaveEnergy = function (data) {
	var now = new Date(); // for now
    var currentHour = now.getHours(); // Lấy giờ
    var currentMin = now.getMinutes(); // Lấy phút
    var combineTime = currentHour + ":" + currentMin + ":00"; // Kết hợp thời gian thành hh:mm:ss

  	var dd = now.getDate();    // Lấy ngày
  	var mm = now.getMonth() + 1; // Lấy tháng nhưng phải +1 
  	var yyyy = now.getFullYear();// Lấy năm 4 chữ số  
  	
  	if (dd <  10)  // Thêm số 0 cho ngày < 10
  	 dd = '0' + dd
  	if (mm <  10)  // Thêm số 0 cho tháng < 10
  	 mm = '0' + mm  

  	var combineDate = yyyy + '-' + mm + '-' + dd; // Kết hợp ngày theo định dạng

	return new Promise (function (resolve, reject) {
		pool.query("INSERT INTO history (value,time,date) VALUES ('"+ data + "','" + combineTime + "','" + combineDate +"');", function(err, rows, fields) { // Truy vấn
			if (err){
				console.log(err);
				resolve("querySaveEnergy-ERROR");
				return;
			} 
			else resolve("querySaveEnergy-OK");
		});
	});
}

// Hàm này sẽ lấy giá trị phút cuối cùng ra so sánh
exports.queryGetLastMinute = function () {
	return new Promise (function (resolve, reject) {
		pool.query("SELECT MINUTE(time) AS time FROM history WHERE id=(SELECT MAX(id) FROM history);", function(err, rows, fields) { // Truy vấn
			if (err){
				resolve("queryGetLastMinute-ERROR");
				return;
			} 
			if(rows.length>0){
				resolve(rows[0].time);
			}
			else resolve("EMPTY_DATA");
		});
	});
}

// Hàm này sẽ truy vấn và trả về các giá trị cảm biến 
exports.queryGetHistory = function (date) {
	return new Promise (function (resolve, reject) {
		pool.query("SELECT value,time FROM history where date = '" + date +"';", function(err, rows, fields) { // Truy vấn
			if (err){
				resolve("queryGetHistory-ERROR");
				return;
			} 
			if(rows.length>0){
				resolve(rows);
			}
			else resolve("EMPTY_DATA");
		});
	});
}

// Hàm này sẽ lưu giá trị mode
exports.querySaveModeStatus = function (stt) {
	return new Promise (function (resolve, reject) {
		// Một số ký tự dạng char hoặc bool sẽ được đổi về số 
		if(stt == false)
			stt = 0;
		else if (stt == true)
			stt = 1;
		if(stt == "0")
			stt = 0;
		else if (stt == "1")
			stt = 1;
		pool.query("UPDATE mode SET mode = '" + stt +"';", function(err, rows, fields) { // Truy vấn
			if (err){
				resolve("querySaveModeStatus-ERROR");
				return;
			} 
			else resolve("querySaveModeStatus-OK");
		});
	});
}

// Hàm này sẽ lấy giá trị trạng thái mode hiện tại
exports.queryGetModeStatus = function () {
	return new Promise (function (resolve, reject) {
		pool.query("SELECT mode FROM mode;", function(err, res, fields) { // Truy vấn
			console.log(res.rows[0].mode);
			if (err){
				resolve("queryGetModeStatus-ERROR");
				return;
			} 
			else resolve(res.rows[0].mode);
		});
	});
}


