/**
 * Pure helpers for matching a procurement request's estimated cost
 * against the `approval_rules` budget tiers. No DB access here — the
 * caller fetches rows and passes them in, which keeps this testable
 * without spinning up a database.
 */

/**
 * True if the requester can sign off on this amount themselves,
 * based on their `users.self_approve_limit`.
 */
function isSelfApprovable(requesterSelfApproveLimit, amount) {
  const limit = Number(requesterSelfApproveLimit) || 0;
  return Number(amount) <= limit;
}

/**
 * Given all active approval_rules rows and a request amount, returns
 * the tiers that apply, sorted by approver_level ascending (1, 2, 3...).
 * Multiple rows can share the same level when two different roles both
 * need to sign off at that stage — normally it's one row per level.
 */
function getMatchingTiers(approvalRules, amount) {
  const value = Number(amount) || 0;

  return approvalRules
    .filter((rule) => {
      if (!rule.is_active) return false;
      const min = Number(rule.min_amount) || 0;
      const max =
        rule.max_amount === null || rule.max_amount === undefined
          ? null
          : Number(rule.max_amount);
      if (value < min) return false;
      if (max !== null && value > max) return false;
      return true;
    })
    .sort((a, b) => a.approver_level - b.approver_level);
}

/**
 * Builds the rows to insert into procurement_approvals, one per
 * matched tier. `approverResolver(role, level)` must return a user id
 * (or null) for that role — how that lookup actually happens (a
 * single designated role-holder, the requester's manager chain, round
 * robin, etc.) is intentionally left to the caller/service so this
 * file stays swap-in-a-different-strategy friendly.
 */
async function buildApprovalRows(procurementId, tiers, approverResolver) {
  const rows = [];
  for (const tier of tiers) {
    const approverId = await approverResolver(tier.approver_role, tier.approver_level);
    if (!approverId) {
      throw new Error(
        `No active user found to approve at level ${tier.approver_level} (role: ${tier.approver_role})`
      );
    }
    rows.push({
      procurement_id: procurementId,
      approver_id: approverId,
      approver_role: tier.approver_role,
      level: tier.approver_level,
      status: 'pending',
    });
  }
  return rows;
}

module.exports = { isSelfApprovable, getMatchingTiers, buildApprovalRows };
