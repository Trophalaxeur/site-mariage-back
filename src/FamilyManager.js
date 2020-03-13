import { auth, db } from './api-admin';

export default class Family {

  constructor(indexRow, familyCode, babysitter, allergies, mailAdress, sundayLunch) {
    this.indexRow = indexRow;
    this.uid = familyCode;
    this.email = familyCode + '@mariage-jean1-et-jean2.fr';
    this.password = familyCode;
    if (babysitter === 'oui') {
      this.babysitter = true;
    }
    if (sundayLunch === 'oui') {
      this.sundayLunch = true;
    }
    if (allergies) {
      this.allergies = allergies;
      this.hasAllergies = true;
    }
    if (mailAdress) {
      this.mailAdress = mailAdress;
    }
    this.members = [];
    this.familyRef = db.ref('/').child('family');
  }

  update(familyFromBdd) {
    this.allergies = familyFromBdd.allergies;
    this.hasAllergies = familyFromBdd.hasAllergies;
    this.babysitter = familyFromBdd.babysitter;
    this.sundayLunch = familyFromBdd.sundayLunch;
    this.mailAdress = familyFromBdd.mailAdress;

    this.members = this.members.map((member) => {
      const findedMember = familyFromBdd.members.find(memberToFind => member.name === memberToFind.name);
      return { ...member, ...findedMember };
    });
  }

  saveFamily() {
    this.isExist().then((isExist) => {
      if (!isExist) {
        this.createFamily();
      } else {
        this.updateFamily();
      }
    });
  }

  updateFamily() {
    this.get().then((familyFromBdd) => {
      this.members = this.members.map((member) => {
        const findedMember = familyFromBdd.members.find(memberToFind => member.name === memberToFind.name);
        return { ...findedMember, ...member };
      });

      this.familyRef.child(this.uid).update({
        members: this.members,
      });
    });
  }

  createFamily() {
    this.familyRef.child(this.uid).set({
      members: this.members,
    });
  }

  isExist() {
    return new Promise((resolve) => {
      return this.familyRef.child(this.uid).once('value', snapshot => resolve(!!snapshot.val()));
    });
  }

  get() {
    return new Promise((resolve) => {
      this.familyRef.child(this.uid).once('value', snapshot => resolve(snapshot.val()));
    });
  }

  display() {
    console.log(`Family ${this.uid} : ${this.members.length} members`);
  }

  getRangeRow(startingIndex) {
    return startingIndex + this.indexRow;
  }

  getRowValues() {
    let firstIndex = true;
    const rows = this.members.map((member) => {
      let row = [Family.translateBooleaninStringForRow(member.willCome), member.age ? member.age : ''];

      if (firstIndex) {
        if (this.hasAllergies) {
          row.push(this.allergies);
        } else {
          row.push('');
        }
        row.push(Family.translateBooleaninStringForRow(this.babysitter));
        row.push(this.mailAdress);
        row.push(Family.translateBooleaninStringForRow(this.sundayLunch));
        firstIndex = false;
        return row;
      }
      return [...row, '', '', '', Family.translateBooleaninStringForRow(this.sundayLunch)];
    });
    console.log('rows', rows);
    return rows;
  }

  static translateBooleaninStringForRow(boolean) {
    if (boolean === true) {
      return 'oui';
    }
    if (boolean === false) {
      return 'non';
    }
    return '';
  }

  addMembers(name, gender, willCome, age) {
    const newMember = { name, gender };
    if (willCome === 'oui' || willCome === 'non') {
      newMember.willCome = willCome === 'oui';
    }
    if (age) {
      newMember.age = age;
    }
    this.members.push(newMember);
  }

  updateFamilyLogin() {
    return auth.updateUser(this.uid, {
      email: this.email,
      password: this.password,
    }).then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log(`Successfully updated family ${this.uid} : ${userRecord}`);
    }).catch((error) => {
      console.log(`Error updating family ${this.uid} : ${error}`);
    });
  }

  createFamilyLogin(forceUpdate) {
    return auth.createUser({
      uid: this.uid,
      email: this.email,
      password: this.password,
    }).then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log('Successfully created new family:', userRecord.uid);
    }).catch((error) => {
      if (forceUpdate) {
        return this.updateFamilyLogin();
      } else {
        console.log(`Error while creating family ${this.uid} : ${error}`);
      }
    });
  }
}
