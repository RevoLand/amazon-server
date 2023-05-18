export const wait = (timeout: number) => new Promise(resolve => { setTimeout(resolve, timeout); });

export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
