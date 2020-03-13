import GoogleSheetApi from './api-google';
import { db } from './api-admin';

const googleSheetApi = new GoogleSheetApi();

const updateFamilies = () => {
  db.ref('/').child('family').once('value', (snapshot) => {
    const familiesFromBdd = snapshot.val();
    googleSheetApi.getFamilies().then((familiesFromSheet) => {
      familiesFromSheet.forEach((familyFromSheet) => {
        console.log('UID', familyFromSheet.uid);
        if (familiesFromBdd && familiesFromBdd[familyFromSheet.uid]) {
          familyFromSheet.update(familiesFromBdd[familyFromSheet.uid]);
        }
      });
      googleSheetApi.updateFamiliesInSheets(familiesFromSheet);
    });
  });
};
setTimeout(updateFamilies, 50);
