const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const HABITS_TABLE = process.env.HABITS_TABLE;
const HABIT_ENTRIES_TABLE = process.env.HABIT_ENTRIES_TABLE;

// Helper: get userId from header (or fallback)
function getUserId(event) {
  const headers = event.headers || {};
  return (
    headers["x-user-id"] ||
    headers["X-User-Id"] ||
    "demo-user" // fallback for testing
  );
}

// Helper: today's date YYYY-MM-DD (UTC)
function getTodayDateString() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: standard HTTP response
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  const httpMethod = event.httpMethod;
  const resource = event.resource;

  try {
    if (resource === "/habits" && httpMethod === "POST") {
      return await createHabit(event);
    }

    if (resource === "/habits" && httpMethod === "GET") {
      return await listHabits(event);
    }

    if (
      resource === "/habits/{habitId}/checkin" &&
      httpMethod === "POST"
    ) {
      return await checkinHabit(event);
    }

    if (resource === "/habits/today" && httpMethod === "GET") {
      return await getTodayStatus(event);
    }

    return response(404, { message: "Route not found" });
  } catch (err) {
    console.error("Error:", err);
    return response(500, {
      message: "Internal server error",
      error: err.message,
    });
  }
};

// ---------- Handlers ----------

async function createHabit(event) {
  const userId = getUserId(event);
  const body = JSON.parse(event.body || "{}");
  const { name, description } = body;

  if (!name) {
    return response(400, { message: "Habit name is required" });
  }

  const habitId =
    "habit-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
  const now = new Date().toISOString();

  const item = {
    userId,
    habitId,
    name,
    description: description || "",
    createdAt: now,
    isActive: true,
  };

  await ddb.send(
    new PutCommand({
      TableName: HABITS_TABLE,
      Item: item,
    })
  );

  return response(201, item);
}

async function listHabits(event) {
  const userId = getUserId(event);

  const result = await ddb.send(
    new QueryCommand({
      TableName: HABITS_TABLE,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: {
        ":u": userId,
      },
    })
  );

  return response(200, result.Items || []);
}

async function checkinHabit(event) {
  const userId = getUserId(event);
  const habitId = event.pathParameters?.habitId;

  if (!habitId) {
    return response(400, { message: "habitId is required in path" });
  }

  const today = getTodayDateString();
  const entryKey = `${today}#${habitId}`;
  const now = new Date().toISOString();

  const item = {
    userId,
    entryKey,
    habitId,
    date: now,
    status: "done",
  };

  await ddb.send(
    new PutCommand({
      TableName: HABIT_ENTRIES_TABLE,
      Item: item,
    })
  );

  return response(200, { message: "Check-in recorded", ...item });
}

async function getTodayStatus(event) {
  const userId = getUserId(event);
  const today = getTodayDateString();

  // 1. Get all habits
  const habitsResult = await ddb.send(
    new QueryCommand({
      TableName: HABITS_TABLE,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: {
        ":u": userId,
      },
    })
  );

  const habits = habitsResult.Items || [];

  if (habits.length === 0) {
    return response(200, []);
  }

  // 2. Get today's entries
  const entriesResult = await ddb.send(
    new QueryCommand({
      TableName: HABIT_ENTRIES_TABLE,
      KeyConditionExpression:
        "userId = :u AND begins_with(entryKey, :d)",
      ExpressionAttributeValues: {
        ":u": userId,
        ":d": today,
      },
    })
  );

  const doneSet = new Set((entriesResult.Items || []).map((e) => e.habitId));

  // 3. Merge
  const result = habits.map((h) => ({
    habitId: h.habitId,
    name: h.name,
    description: h.description,
    doneToday: doneSet.has(h.habitId),
  }));

  return response(200, result);
}
