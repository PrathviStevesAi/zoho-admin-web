import { fetchShiftDetailsAction } from "../actions/dashboard.actions";

async function main() {
  const shiftId = "d0621682-d03c-4b8d-89f1-66431cfe3457";
  console.log("Fetching shift details for:", shiftId);
  const result = await fetchShiftDetailsAction(shiftId);
  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
