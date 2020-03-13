import * as google from 'googleapis';
import * as fs from 'fs';
import * as readline from 'readline';
import * as _ from 'lodash';
import myClientSecret from './client_secret.json';
import FamilyManager from './FamilyManager';

const GoogleAuth = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';
const SPREADSHEETID = '1-EuRIpiDeSCONCLudAm-gLaEbAmrEGIbUsASSUm-wRw';
const STARTING_ROW = 2;
const API_TIMEOUT_MS = 50;
const GSheets = google.sheets('v4');
export default class GoogleSheetApi {
  constructor() {
    this.families = [];
    this._authorize();
  }

  static getRange(staringRow) {
    return `Firebase!B${staringRow}:K`;
  }
  static getDataOnlyRange(staringRow) {
    return `Firebase!F${staringRow}:K`;
  }

  updateFamiliesInSheets(families) {
    // families.forEach((family) => {
    setTimeout(this.updateFamilyInSheets.bind(this, families, 0), API_TIMEOUT_MS);
    // });
  }

  updateFamilyInSheets(families, familyIndex) {
    console.log('updateFamilyInSheets', familyIndex, families.length);
    if (familyIndex >= families.length) {
      console.log('updateFamilyInSheets STOP');
      return;
    }
    const family = families[familyIndex];
    GSheets.spreadsheets.values.update({
      auth: this._oauth2Client,
      spreadsheetId: SPREADSHEETID,
      range: GoogleSheetApi.getDataOnlyRange(family.getRangeRow(STARTING_ROW)),
      valueInputOption: 'USER_ENTERED',
      resource: {
        range: GoogleSheetApi.getDataOnlyRange(family.getRangeRow(STARTING_ROW)),
        majorDimension: 'ROWS',
        values: family.getRowValues(),
      },
    }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Family ${family.uid} updated in sheet`);
      }
      setTimeout(this.updateFamilyInSheets.bind(this, families, familyIndex + 1), API_TIMEOUT_MS);
    });
  }

  // Rows :
  // 0 -> Code Famille
  // 1 -> Nom
  // 2 -> Prénom
  // 3 -> Genre
  // 4 -> Is Coming
  // 5 -> Age
  // 6 -> Allergies
  // 7 -> Babysitter
  // 8 -> MailAdress
  // 9 -> sundayLunch
  getFamilies() {
    return GoogleSheetApi.getSpreadSheetsValuesAsync(this._oauth2Client, GoogleSheetApi.getRange(STARTING_ROW)).then((rows) => {
      rows.forEach((row, indexRow) => {
        if (row[0]) {
          const familyCode = row[0].toLowerCase();
          let currentFamily = _.find(this.families, family => family.uid === familyCode);
          if (!currentFamily) {
            currentFamily = new FamilyManager(indexRow, familyCode, row[7], row[8], row[9]);
            this.families.push(currentFamily);
          }
          currentFamily.addMembers(`${row[1]} ${row[2]}`, row[3], row[4], row[5], row[6]);
        }
      });
      return this.families;
    }).catch((error) => {
      console.log('getFamilies ERROR', error);
      return [];
    });
  }

  static getSpreadSheetsValuesAsync(auth, range) {
    return new Promise((resolve, reject) => {
      return GSheets.spreadsheets.values.get({
        auth,
        spreadsheetId: SPREADSHEETID,
        range,
      }, (err, response) => {
        if (err) {
          reject('The API returned an error: ' + err);
        }
        const rows = response.values;
        if (rows.length === 0) {
          reject('No data found.');
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  _authorize() {
    const clientSecret = myClientSecret.web.client_secret;
    const clientId = myClientSecret.web.client_id;
    const redirectUrl = myClientSecret.web.redirect_uris[0];
    const auth = new GoogleAuth();
    this._oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        this._getNewToken();
      } else {
        this._oauth2Client.credentials = JSON.parse(token);
      }
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  _getNewToken() {
    const authUrl = this._oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      this._oauth2Client.getToken(code, (err, token) => {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        this._oauth2Client.credentials = token;
        this._storeToken();
      });
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  _storeToken() {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        /**
     * Print the names and majors of students in a sample spreadsheet:
     * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
     */

        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(this._oauth2Client.credentials));
    console.log('Token stored to ' + TOKEN_PATH);
  }
}
