import { setDoc } from "firebase/firestore";
import { AccountPrefsFlagsT, AccountPrefsT } from "../lib/prefs";
import { logAsyncErrors } from "../lib/utils";
import { useSnackbar } from "./Snackbar";
import { getDocRef } from "../lib/firebaseWrapper";

interface PrefSettingProps {
    prefs: AccountPrefsT | undefined;
    userId: string;
    flag: keyof AccountPrefsFlagsT;
    text: string;
    invert?: boolean;
}
  
export const PrefSetting = (props: PrefSettingProps) => {
  const { showSnackbar } = useSnackbar();
  const prefSet = props.prefs?.[props.flag] ?? false;
  return (
    <label>
    <input
      css={{ marginRight: '1em' }}
      type="checkbox"
      checked={props.invert ? !prefSet : prefSet}
      onChange={logAsyncErrors(async (e) => {
        await setDoc(
          getDocRef('prefs', props.userId),
            {
            [props.flag]: props.invert ? !e.target.checked : e.target.checked,
            },
            { merge: true }
        ).then(() => {
            showSnackbar('Preferences Updated');
        });
        })}
      onClick={(e) => {
        e.stopPropagation();
      }}
    />
    {props.text}
    </label>
);
};

export const SolverPreferencesList = ({prefs, userId}: {prefs?: AccountPrefsT, userId: string}) => {
  if (!prefs) {
    return null; // or some default content
  }
  return  (
  <>
    <li>
      <PrefSetting
        prefs={prefs}
        userId={userId}
        flag={'advanceOnPerpendicular'}
        text="Advance to next square when changing direction with arrow keys"
      />
    </li>
    <li>
      <PrefSetting
        prefs={prefs}
        userId={userId}
        flag={'dontSkipCompleted'}
        invert={true}
        text="Skip over completed squares after entering a letter"
      />
    </li>
    <li>
      <PrefSetting
        prefs={prefs}
        userId={userId}
        flag={'dontAdvanceWordAfterCompletion'}
        invert={true}
        text="Move to next clue after completing an entry"
      />
    </li>
    <li>
      <PrefSetting
        prefs={prefs}
        userId={userId}
        flag={'solveDownsOnly'}
        text="Start puzzles in downs-only mode"
      />
    </li>
    <li>
      <PrefSetting
        prefs={prefs}
        userId={userId}
        flag={'dontPauseOnLostFocus'}
        invert={true}
        text="Automatically pause solving when page loses focus"
      />
    </li>
  </>
  );
};