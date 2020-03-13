import GoogleSheetApi from './api-google';

const googleSheetApi = new GoogleSheetApi();

const getFamilies = () => {
  googleSheetApi.getFamilies().then((families) => {
    families.forEach(family => family.display());
    families.forEach(family => family.createFamilyLogin(false));
    families.forEach(family => family.saveFamily());
  });
};

setTimeout(getFamilies, 50);
