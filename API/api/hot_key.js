const router = require('express').Router();
const mysql = require('mariadb');

// 設定 MySQL 連線
const db = mysql.createPool({
    connectionLimit : 6,
    host: '163.22.17.116',
    user: 'test',
    password: 'test#313',
    database: 'home_assistant',
});

// 查詢所有 Hotkey
router.get('/', async function(req, res) {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.query('SELECT * FROM Hotkey');
        res.json(result);
    }
    catch(e) {
        console.error(e);
        res.status(500).send('查詢失敗');
    }
    finally {
        conn.release();
    }
});

// 新增 Hotkey
router.post('/', async (req, res) => {
    let conn;
    try {
        const { uid, key, value, status = 1 } = req.body;
	console.log('insert', uid, key, value, status);
    const sql = 'INSERT INTO Hotkey (`uid`, `key`, `value`, `status`) VALUES (?, ?, ?, ?)';
    const conn = await db.getConnection();
    await conn.query(sql, [uid, key, value, status], (err, result) => {
        if (err) {
			console.error(err);
            res.status(500).send('新增失敗');
        } else {
            res.status(201).json({ message: '新增成功', id: result.insertId });
        }
    });
    conn.release();
});

// 修改 Hotkey
router.put('/', async (req, res) => {
    const { uid, key, value, status } = req.body;
    const sql = 'UPDATE Hotkey SET `value` = ?, `status` = ? WHERE `uid` = ? AND `key` = ?';
    const conn = await db.getConnection();
    await conn.query(sql, [value, status, uid, key], (err, result) => {
        if (err) {
            res.status(500).send('修改失敗');
        } else if (result.affectedRows === 0) {
            res.status(404).send('找不到指定的 Hotkey');
        } else {
            res.json({ message: '修改成功' });
        }
    });
    conn.release();
});

// 刪除 Hotkey
router.delete('/', async (req, res) => {
    const { uid, key } = req.body;
    const sql = 'DELETE FROM Hotkey WHERE `uid` = ? AND `key` = ?';
    const conn = await db.getConnection();
    await conn.query(sql, [uid, key], (err, result) => {
        if (err) {
            res.status(500).send('刪除失敗');
        } else if (result.affectedRows === 0) {
            res.status(404).send('找不到指定的 Hotkey');
        } else {
            res.json({ message: '刪除成功' });
        }
    });
    conn.release();
});

module.exports = router;
