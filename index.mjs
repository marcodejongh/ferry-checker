import querystring from "querystring";
import fetch from "node-fetch";
import * as fs from "node:fs/promises";
import { cosmiconfig } from "cosmiconfig";

const SIMPLEPUSH_URL = "https://api.simplepush.io/send";

const explorer = cosmiconfig("ferrychecker");
const config = (await explorer.search())?.config;

const requestExplorer = cosmiconfig("ferrycheckerrequest");
const ferriesRequest = (await requestExplorer.search())?.config;

const isSailingsAvailable = (sailings) => sailings.length > 0 && sailings[0].isSoldOut === false;

if (!config) {
  throw new Error("Couldn't find config");
}

if (config.simplePushKey === 'fillmein') {
  throw new Error("No simple push key provided")
}

const checkFerries = async () => {

  const desiredDates = config.desiredDates;

  console.log("Fetching ferries");
  
  const response = await fetch("https://www.spiritoftasmania.com.au/umbraco/api/ibp/prices", {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      jsbreakingchangeversion: config.jsbreakingchangeversion,
    },
    body: JSON.stringify(ferriesRequest),
    method: "post",
  });

  if (!response.ok) {
    throw new Error(`Didn't receive an ok response from spirit, got error: `, response.status);
  }

  const res = await response.json();

  const resultsIWant = res.results.filter((item) => {
    const desiredDateMetaData = desiredDates.find(({ date }) => date === item.date);

    if (!desiredDateMetaData) {
      return false;
    }

    return (
      (desiredDateMetaData.day && isSailingsAvailable(item.daySailings)) ||
      (desiredDateMetaData.night && isSailingsAvailable(item.nightSailings))
    );
  });
  if (!res || !res.results || !res.results.length) console.log(`Fetched ${res.results.length} ferries`);

  console.log(`Of those results, we've found ${resultsIWant.length} available ferries`);

  if (resultsIWant.length > 0) {
    let data = {
      key: config.simplePushKey,
      title: "Found available ferries",
      msg: `Found ferries for date(s): ${resultsIWant
        .map(
          ({ date, daySailings, nightSailings }) =>
            `${date.replace("T00:00:00", "")}: ${isSailingsAvailable(daySailings) ? "day" : ""} ${
              isSailingsAvailable(nightSailings) ? "night" : ""
            }`
        )
        .join("\n")}`,
      event: "event",
    };

    await fetch(SIMPLEPUSH_URL, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: querystring.stringify(data),
      method: "post",
    });
  }
};

checkFerries()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    
    let data = {
      key: config.simplePushKey,
      title: "Error fetching ferries",
      msg: err.toString(),
      event: "event",
    };
    
    fetch(SIMPLEPUSH_URL, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: querystring.stringify(data),
      method: "post",
    })
      .then(() => {
        process.exit(1);
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  });
