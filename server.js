const express = require('express');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// 全局变量
let isRunning = false;
let resourceConsumerInterval = null;
let totalConsumedKB = 0;
let startTime = null;
let lastConsumeTime = null;

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 资源消耗函数 - 每秒消耗1KB网络流量
function consumeResources() {
  try {
    // 使用更可靠的API端点
    const urls = [
      'https://api.github.com/users/github',
      'https://api.github.com/repos/nodejs/node',
      'https://api.github.com/users/microsoft',
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/comments/1',
      'https://httpbin.org/bytes/1024',
      'https://httpbin.org/json',
      'https://httpbin.org/uuid',
      'https://catfact.ninja/fact',
      'https://api.coindesk.com/v1/bpi/currentprice.json'
    ];
    
    // 随机选择一个URL
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    
    // 发起HTTP请求获取数据
    const protocol = randomUrl.startsWith('https') ? https : http;
    const req = protocol.get(randomUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // 计算获取的数据大小（KB）
        let dataSizeKB = Math.round(Buffer.byteLength(data, 'utf8') / 1024);
        
        // 如果获取的数据小于1KB，则记录为1KB（因为请求本身也会消耗流量）
        if (dataSizeKB < 1) {
          dataSizeKB = 1;
        }
        
        // 更新统计信息
        totalConsumedKB += dataSizeKB;
        lastConsumeTime = new Date();
        
        console.log(`网络流量消耗中... 本次消耗: ${dataSizeKB} KB, 累计消耗: ${totalConsumedKB} KB`);
      });
    });
    
    req.on('error', (error) => {
      console.error('网络请求错误:', error.message);
      // 即使网络请求失败，也记录1KB的消耗（尝试连接也算流量）
      totalConsumedKB += 1;
      lastConsumeTime = new Date();
      console.log(`网络流量消耗中... 连接失败，记录消耗: 1 KB, 累计消耗: ${totalConsumedKB} KB`);
    });
    
    // 设置超时，避免请求挂起
    req.setTimeout(3000, () => {
      req.abort();
      console.log('请求超时，已终止');
      // 超时也算消耗了流量
      totalConsumedKB += 1;
      lastConsumeTime = new Date();
      console.log(`网络流量消耗中... 请求超时，记录消耗: 1 KB, 累计消耗: ${totalConsumedKB} KB`);
    });
    
  } catch (error) {
    console.error('资源消耗错误:', error);
    // 即使出错也记录1KB的消耗
    totalConsumedKB += 1;
    lastConsumeTime = new Date();
    console.log(`网络流量消耗中... 发生错误，记录消耗: 1 KB, 累计消耗: ${totalConsumedKB} KB`);
  }
}

// 启动资源消耗
function startResourceConsumption() {
  if (isRunning) return;
  
  isRunning = true;
  startTime = new Date();
  
  // 立即执行一次
  consumeResources();
  
  // 设置定时器，每秒执行一次
  resourceConsumerInterval = setInterval(consumeResources, 1000);
  
  console.log('网络流量消耗已启动，每秒约消耗1KB');
}

// 停止资源消耗
function stopResourceConsumption() {
  if (!isRunning) return;
  
  isRunning = false;
  
  if (resourceConsumerInterval) {
    clearInterval(resourceConsumerInterval);
    resourceConsumerInterval = null;
  }
  
  console.log('网络流量消耗已停止');
}

// API路由
app.get('/', (req, res) => {
  res.send(`
    <h1>网络流量消耗服务器</h1>
    <p>这是一个Node.js服务器，每秒消耗约1KB网络流量</p>
    <p><a href="/status">查看状态</a></p>
    <p><a href="/start">启动流量消耗</a></p>
    <p><a href="/stop">停止流量消耗</a></p>
  `);
});

// 启动资源消耗
app.get('/start', (req, res) => {
  startResourceConsumption();
  res.redirect('/status');
});

// 停止资源消耗
app.get('/stop', (req, res) => {
  stopResourceConsumption();
  res.redirect('/status');
});

// 状态监控接口
app.get('/status', (req, res) => {
  const uptime = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;
  const expectedConsumption = uptime * 1;
  
  res.json({
    isRunning,
    totalConsumedKB,
    uptimeSeconds: uptime,
    expectedConsumptionKB: expectedConsumption,
    lastConsumeTime,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  });
});

// 优雅关闭处理
function gracefulShutdown() {
  console.log('接收到关闭信号，正在优雅关闭...');
  
  stopResourceConsumption();
  
  console.log('服务器关闭');
  process.exit(0);
}

// 注册关闭事件监听器
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  gracefulShutdown();
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('访问 /status 查看网络流量消耗状态');
  console.log('访问 /start 启动流量消耗');
  console.log('访问 /stop 停止流量消耗');
  
  // 自动启动资源消耗
  startResourceConsumption();
});