const webSocket = {
  host: process.env.WEB_SOCKET_HOST ?? 'localhost',
  port: +(process.env.WEB_SOCKET_PORT ?? 8080),
  secret: process.env.WEB_SOCKET_SECRET,
};

export default webSocket;