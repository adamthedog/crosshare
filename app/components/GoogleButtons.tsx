import { LegacyPlayV } from '../lib/dbtypes';
import { getValidatedAndDelete, setInCache } from '../lib/dbUtils';
import { App, AuthProvider } from '../lib/firebaseWrapper';
import { event } from '../lib/gtag';
import type firebase from 'firebase/app';

interface GoogleButtonProps {
  postSignIn?: (user: firebase.User) => Promise<void>;
}

export const GoogleSignInButton = ({ postSignIn }: GoogleButtonProps) => {
  function signin() {
    App.auth()
      .signInWithPopup(AuthProvider)
      .then((userCredential) => {
        event({
          action: 'login',
          category: 'engagement',
          label: 'google',
        });
        if (userCredential.user && postSignIn) {
          return postSignIn(userCredential.user);
        }
      });
  }
  return (
    <input
      type="image"
      width="191"
      height="46"
      src="/googlesignin.png"
      alt="Sign in with Google"
      onClick={signin}
    />
  );
};

export const GoogleLinkButton = ({
  user,
  postSignIn,
}: { user: firebase.User } & GoogleButtonProps) => {
  function signin() {
    user
      .linkWithPopup(AuthProvider)
      .then((userCredential) => {
        console.log('linked w/o needing a merge');
        event({
          action: 'login',
          category: 'engagement',
          label: 'google',
        });
        if (userCredential.user && postSignIn) {
          return postSignIn(userCredential.user);
        }
      })
      .catch(async (error: firebase.auth.AuthError) => {
        if (error.code !== 'auth/credential-already-in-use') {
          console.log(error);
          return;
        }
        if (!error.credential) {
          throw new Error('missing new user after link');
        }
        // Get anonymous user plays
        const db = App.firestore();
        const plays = await getValidatedAndDelete(
          db.collection('p').where('u', '==', user.uid),
          LegacyPlayV
        );
        return App.auth()
          .signInWithCredential(error.credential)
          .then(async (value: firebase.auth.UserCredential) => {
            console.log('signed in as new user ' + value.user?.uid);
            const newUser = value.user;
            if (!newUser) {
              throw new Error('missing new user after link');
            }
            await Promise.all(
              plays.map((play) => {
                play.u = newUser.uid;
                console.log('Updating play ' + play.c + '-' + play.u);
                // TODO set this in DB and in the plays doc in cache. Update updated at in plays cache
                return setInCache({
                  collection: 'p',
                  docId: play.c + '-' + newUser.uid,
                  localDocId: play.c,
                  value: play,
                  validator: LegacyPlayV,
                  sendToDB: true,
                });
              })
            );
            user.delete();
            console.log('linked and merged plays');
            if (postSignIn) {
              return postSignIn(newUser);
            }
          });
      });
  }
  return (
    <input
      type="image"
      width="191"
      height="46"
      src="/googlesignin.png"
      alt="Sign in with Google"
      onClick={signin}
    />
  );
};
