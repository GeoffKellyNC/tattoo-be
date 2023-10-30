const sanitizeUserData = (data) => {
    return new Promise((resolve, reject) => {
      try {
        const sanitizedData = {...data};
  
        const propertiesToDelete = [
          'password', 'googleId', 'session_token', 'account_status',
          'isAdmin', 'isMod', 'isClient', 'isArtist', 'is_active', 
          'is_deleted', 'date_deleted', 'date_created', 
          'attr1', 'attr2', 'attr3', 'attr4', 'attr5', 
          'attr6', 'attr7', 'attr8'
        ];
  
        propertiesToDelete.forEach(prop => {
          delete sanitizedData[prop];
        });
  
        resolve(sanitizedData);
      } catch (error) {
        reject(error);
      }
    });
  };
  
  module.exports = sanitizeUserData;
  