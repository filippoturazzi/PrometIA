// Os testes rodam fora do Next: "server-only" lança erro fora do bundle de servidor,
// então aqui ele vira um módulo vazio. (Rodar com --conditions=react-server quebra o lucide-react.)
const path = require.resolve("server-only");
require.cache[path] = { id: path, filename: path, loaded: true, exports: {} };
