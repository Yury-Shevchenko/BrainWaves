import { combineEpics } from "redux-observable";
import * as fs from "fs";
import { map, mapTo, pluck, filter, takeUntil } from "rxjs/operators";
import { SET_TYPE, START, STOP } from "../actions/experimentActions";
import {
  DEVICES,
  MUSE_CHANNELS,
  EMOTIV_CHANNELS
} from "../constants/constants";
import { loadTimeline } from "../utils/jspsych/functions";
import { injectMuseMarker } from "../utils/muse";
import { injectEmotivMarker } from "../utils/emotiv";
import { writeHeader, writeEEGData } from "../utils/filesystem/write";

export const SET_TIMELINE = "LOAD_TIMELINE";
export const SET_IS_RUNNING = "SET_IS_RUNNING";
export const SET_SESSION = "SET_SESSION";

// -------------------------------------------------------------------------
// Action Creators

const setTimeline = payload => ({
  payload,
  type: SET_TIMELINE
});

const setIsRunning = payload => ({
  payload,
  type: SET_IS_RUNNING
});

const setSession = payload => ({
  payload,
  type: SET_SESSION
});

// -------------------------------------------------------------------------
// Epics

const loadDefaultTimelineEpic = (action$, store) =>
  action$.ofType(SET_TYPE).pipe(
    pluck("payload"),
    map(type => {
      if (store.getState().device.deviceType === DEVICES.EMOTIV) {
        return loadTimeline(type, value =>
          injectEmotivMarker(
            store.getState().device.client,
            value,
            new Date().getTime()
          )
        );
      }
      return loadTimeline(type, value =>
        injectMuseMarker(
          store.getState().device.client,
          value,
          new Date().getTime()
        )
      );
    }),
    map(setTimeline)
  );

const startEpic = (action$, store) =>
  action$.ofType(START).pipe(
    filter(
      () =>
        !store.getState().experiment.isRunning &&
        store.getState().experiment.subject !== ""
    ),
    map(() => {
      const writeStream = fs.createWriteStream(
        `./${store.getState().experiment.subject}_${
          store.getState().experiment.session
        }.csv`
      );

      writeHeader(
        writeStream,
        store.getState().device.deviceType === DEVICES.EMOTIV
          ? EMOTIV_CHANNELS
          : MUSE_CHANNELS
      );
      const recordSubscription = store
        .getState()
        .device.rawObservable.pipe(takeUntil(action$.ofType(STOP)))
        .subscribe(eegData => writeEEGData(writeStream, eegData));
    }),
    mapTo(true),
    map(setIsRunning)
  );

const sessionCountEpic = (action$, store) =>
  action$.ofType(SET_IS_RUNNING).pipe(
    pluck("payload"),
    filter(isRunning => isRunning),
    map(() => setSession(store.getState().experiment.session + 1))
  );

export default combineEpics(
  loadDefaultTimelineEpic,
  startEpic,
  sessionCountEpic
);
