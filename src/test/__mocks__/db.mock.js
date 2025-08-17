let users = [];
let autoId = 1;

function reset() { users = []; autoId = 1; }
const clone = (x) => JSON.parse(JSON.stringify(x));

// 👇 API seed tiện dùng trong test
function addUser({ email, password = 'hash', name = 'Tester', role = 'USER', status = 'PENDING', deleted = 0 }) {
    const row = { id: autoId++, email, password, name, role, status, deleted, google_id: null };
    users.push(row);
    return row;
}
function getUsers() { return users.map(clone); }

async function execute(sql, params = []) {
    const q = sql.trim().toLowerCase();

    // SELECT ... WHERE email = ?
    if (q.startsWith('select') && q.includes('from users') && q.includes('where email =')) {
        const email = params[0];
        const found = users.filter(u => u.email === email);
        return [found.map(clone), []];
    }

    // INSERT users (email, password, name, role, status, deleted)
    if (q.startsWith('insert into users')) {
        const [email, password, name] = params;
        return [{ insertId: addUser({ email, password, name }).id }, []];
    }

    // UPDATE users SET status="ACTIVE" WHERE email = ? AND deleted = FALSE
    if (q.startsWith('update users set status') && q.includes('where email =')) {
        const email = params[0];
        let affected = 0;
        users = users.map(u => {
            if (u.email === email && u.deleted === 0) {
                affected += 1;
                return { ...u, status: 'ACTIVE' };
            }
            return u;
        });
        return [{ affectedRows: affected }, []];
    }

    return [[], []];
}

module.exports = { execute, __reset: reset, __seed: { addUser, getUsers } };
