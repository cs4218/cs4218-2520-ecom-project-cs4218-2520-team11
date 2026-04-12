#!/usr/bin/env node

const { readFileSync, existsSync } = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const scriptDir = __dirname;
const projectDir = path.dirname(scriptDir);
const seedDir = path.join(scriptDir, "seed-data");
const composeFile = path.join(projectDir, "docker-compose.yml");

function usage() {
  console.log("Usage: node scripts/db.js {start|stop|seed|reset|logs|status}");
}

function run(command, args, options = {}) {
  const spawnOptions = {
    ...options,
  };

  if (options.input !== undefined) {
    spawnOptions.stdio = ["pipe", "inherit", "inherit"];
  } else {
    spawnOptions.stdio = "inherit";
  }

  const result = spawnSync(command, args, {
    ...spawnOptions,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    return null;
  }

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function getComposeCommand() {
  const dockerComposeVersion = runCapture("docker", ["compose", "version"]);
  if (dockerComposeVersion) {
    return ["docker", "compose"];
  }

  const legacyComposeVersion = runCapture("docker-compose", ["version"]);
  if (legacyComposeVersion) {
    return ["docker-compose"];
  }

  throw new Error(
    "Neither 'docker compose' nor 'docker-compose' is available in PATH."
  );
}

function compose(args) {
  const [command, ...baseArgs] = getComposeCommand();
  run(command, [...baseArgs, "-f", composeFile, ...args]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
  console.log("Starting MongoDB...");
  compose(["up", "-d"]);
  console.log("MongoDB is running on localhost:27017");
}

async function stop() {
  console.log("Stopping MongoDB...");
  compose(["down"]);
  console.log("MongoDB stopped");
}

function importCollection(collection) {
  const filePath = path.join(seedDir, `${collection}.json`);
  if (!existsSync(filePath)) {
    return;
  }

  console.log(`  Importing ${collection}...`);
  const json = readFileSync(filePath);
  run(
    "docker",
    [
      "exec",
      "-i",
      "mongodb",
      "mongoimport",
      "--authenticationDatabase",
      "admin",
      "-u",
      "root",
      "-p",
      "password",
      "--db",
      "test",
      "--collection",
      collection,
      "--jsonArray",
      "--drop",
      "--file",
      "/dev/stdin",
    ],
    {
      input: json,
    }
  );
}

async function seed() {
  console.log("Seeding database...");
  console.log("Waiting for MongoDB to be ready...");
  await sleep(2000);

  for (const collection of ["categories", "orders", "products", "users"]) {
    importCollection(collection);
  }

  console.log("Database seeded successfully!");
}

async function reset() {
  console.log("Resetting database...");
  compose(["down", "-v"]);
  await start();
  await sleep(3000);
  await seed();
  console.log("Database reset complete!");
}

async function logs() {
  compose(["logs", "-f", "mongo"]);
}

async function status() {
  run("docker", [
    "ps",
    "--filter",
    "name=mongodb",
    "--format",
    "table {{.Names}}\t{{.Status}}\t{{.Ports}}",
  ]);
}

const command = process.argv[2];

const commands = {
  start,
  stop,
  seed,
  reset,
  logs,
  status,
};

if (!commands[command]) {
  usage();
  process.exit(1);
}

commands[command]().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
