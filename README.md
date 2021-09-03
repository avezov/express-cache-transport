# express-cache-transport

Кеширование запросов к API.

# Installation

```bash
npm install --save express-cache-transport
```

# Example

```js
import cacheTransport from 'express-cache-transport';

const cacheConfig = [
  {
    path: '/kalinka',
    destination: 'http://example.com/hohloma',
    ttl: 60 * 1000,
  },
  {
    path: '/malinka',
    destination: 'http://example.com/ushanka',
    ttl: 60 * 1000,
    redirectOnError: false,
    onError(error, req, res) {
      res.send('custom item error')
    }
  }
];

const transportApp = express();
transportApp.use(cacheTransport({
  cacheConfig
}));

const app = express();
app.use('/cachetransport', transportApp);
app.listen(3000);
```

# Parameters
### cacheConfig:

```js
[
  {
    // исходный URL
    path: '/malinka',

    // целевой URL с данными, которые необходимо закешировать
    destination: 'http://example.com/ushanka',

    // время жизни кеша в мс
    ttl: 60 * 1000,

    // делать редирект на целевой URL в случае возникновения ошибки
    redirectOnError: false,

    // свой обработчик ошибок со стороны целевого URL
    onError(error, req, res) {
      res.send('custom item error')
    }
  }
]
```

### express-cache-transport:

```js
transportApp.use(cacheTransport({
  cacheConfig,

  // добавить эндпоинты для отладки
  debug: true,

  // использовать проброс куки к целевому URL
  useCookie: true,

  // пользовательский алгоритм генерации ключа для кеширования
  computeHash: ({ search, cookies }) => {
    return `${search}#${cookies.language}`
  },
}));
```