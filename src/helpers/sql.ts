import sqlConnection from '../data-source.js';

export const connectToSql = async (): Promise<boolean> => {
  try {
    console.log('Connecting to SQL.');

    await sqlConnection.initialize();

    console.log('SQL Connection established.');

    return true;
  } catch (error) {
    console.error('An error happened while connecting to SQL.', error);

    throw new Error('SQLConnectionFailed');
  }
};
