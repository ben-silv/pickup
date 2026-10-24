/**
 * Database access-rule tests. They run the real migrations against a throwaway Postgres and act as
 * different users, the same way Supabase does (role `authenticated` + the user's id in the JWT claim).
 *
 *   DATABASE_URL=postgres://postgres@localhost:5432/pickup_test npm run test:db
 *
 * Skipped when DATABASE_URL isn't set. The database is wiped at the start, so never point this at real data.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;
const root = join(__dirname, "..", "..");

describe.skipIf(!url)("database access rules", () => {
  let pool: pg.Pool;

  async function admin(sql: string, params: unknown[] = []) {
    return pool.query(sql, params);
  }

  /** Runs `fn` as a signed-in user (or anonymous when `userId` is null), inside a transaction. */
  async function as<T>(userId: string | null, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
    const c = await pool.connect();
    try {
      await c.query("begin");
      await c.query(`set local role ${userId ? "authenticated" : "anon"}`);
      if (userId) await c.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
      const out = await fn(c);
      await c.query("commit");
      return out;
    } catch (err) {
      await c.query("rollback");
      throw err;
    } finally {
      c.release();
    }
  }

  async function newUser(email: string): Promise<string> {
    const { rows } = await admin("insert into auth.users (email) values ($1) returning id", [email]);
    return rows[0].id as string;
  }

  async function newProject(ownerId: string, status: "draft" | "published" = "published") {
    return as(ownerId, async (c) => {
      const { rows } = await c.query(
        `insert into projects (owner_id, title, pitch, stage, status)
         values ($1, 'Dewick wait-time tracker', 'Live line length at the dining halls.', 'prototype', $2) returning id`,
        [ownerId, status],
      );
      const projectId = rows[0].id as string;
      const role = await c.query(
        `insert into roles (project_id, category, need, hours) values ($1, 'design', 'Redesign three screens', 5) returning id`,
        [projectId],
      );
      return { projectId, roleId: role.rows[0].id as string };
    });
  }

  async function offer(helperId: string, roleId: string) {
    return as(helperId, async (c) => {
      const { rows } = await c.query(
        "insert into offers (role_id, helper_id, note) values ($1, $2, 'I can do this by Sunday.') returning id",
        [roleId, helperId],
      );
      return rows[0].id as string;
    });
  }

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: url });
    await admin("drop schema if exists public cascade; drop schema if exists auth cascade; create schema public;");
    await admin(readFileSync(join(root, "tests/db/supabase-stub.sql"), "utf8"));
    const dir = join(root, "supabase/migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      await admin(readFileSync(join(dir, file), "utf8"));
    }
  });

  beforeEach(async () => {
    await admin("truncate auth.users cascade");
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe("sign-up", () => {
    it("creates a profile for Tufts emails, lowercased", async () => {
      const id = await newUser("Ben@Tufts.edu");
      const { rows } = await admin("select email from profiles where id = $1", [id]);
      expect(rows[0].email).toBe("ben@tufts.edu");
    });

    it("rejects non-Tufts emails outright", async () => {
      await expect(newUser("someone@gmail.com")).rejects.toThrow(/Tufts students/);
      await expect(newUser("x@tufts.edu.evil.com")).rejects.toThrow(/Tufts students/);
    });
  });

  describe("profiles", () => {
    it("lets you edit your own profile but not your email or anyone else's", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");

      await as(ben, (c) => c.query("update profiles set full_name = 'Ben Silver' where id = $1", [ben]));
      await expect(as(ben, (c) => c.query("update profiles set email = 'x@tufts.edu' where id = $1", [ben]))).rejects.toThrow(
        /permission denied/,
      );
      const res = await as(ben, (c) => c.query("update profiles set full_name = 'Hacked' where id = $1", [maya]));
      expect(res.rowCount).toBe(0);
    });

    it("hides everything from signed-out visitors", async () => {
      await newUser("ben@tufts.edu");
      await expect(as(null, (c) => c.query("select * from profiles"))).rejects.toThrow(/permission denied/);
      await expect(as(null, (c) => c.query("select * from projects"))).rejects.toThrow(/permission denied/);
    });
  });

  describe("projects and roles", () => {
    it("shows drafts only to their owner", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      await newProject(ben, "draft");

      const mine = await as(ben, (c) => c.query("select id from projects"));
      const theirs = await as(maya, (c) => c.query("select id from projects"));
      expect(mine.rowCount).toBe(1);
      expect(theirs.rowCount).toBe(0);
    });

    it("doesn't let you create a project as someone else or add roles to their project", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { projectId } = await newProject(ben);

      await expect(
        as(maya, (c) =>
          c.query(
            "insert into projects (owner_id, title, pitch, stage) values ($1, 'Fake project', 'Pretending to be Ben', 'idea')",
            [ben],
          ),
        ),
      ).rejects.toThrow(/row-level security/);
      await expect(
        as(maya, (c) =>
          c.query("insert into roles (project_id, category, need, hours) values ($1, 'ml', 'Sneaky role here', 3)", [projectId]),
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("lists open roles on published projects in the feed view", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      await newProject(ben, "published");
      await newProject(ben, "draft");
      const feed = await as(maya, (c) => c.query("select title, category, hours from open_roles"));
      expect(feed.rows).toEqual([{ title: "Dewick wait-time tracker", category: "design", hours: 5 }]);
    });

    it("doesn't let owners set role status directly", async () => {
      const ben = await newUser("ben@tufts.edu");
      const { roleId } = await newProject(ben);
      await expect(as(ben, (c) => c.query("update roles set status = 'filled' where id = $1", [roleId]))).rejects.toThrow(
        /permission denied/,
      );
    });
  });

  describe("create_project", () => {
    const roles = (list: { category: string; need: string; hours: number | string }[]) => JSON.stringify(list);
    const create = (userId: string | null, status: string, roleList: string) =>
      as(userId, (c) =>
        c.query(
          `select create_project('Dewick wait-time tracker', 'Live line length at the dining halls.', '', 'prototype',
                                 '', 'https://github.com/x/y', $1::project_status, $2::jsonb) as id`,
          [status, roleList],
        ),
      );

    it("saves the project and its roles together, owned by the caller, roles in order", async () => {
      const ben = await newUser("ben@tufts.edu");
      const { rows } = await create(
        ben,
        "published",
        roles([
          { category: "design", need: "Redesign three screens", hours: 5 },
          { category: "writing", need: "App Store description", hours: 2 },
        ]),
      );
      const project = await admin("select owner_id, status, prototype_url, repo_url from projects where id = $1", [rows[0].id]);
      expect(project.rows[0]).toEqual({ owner_id: ben, status: "published", prototype_url: null, repo_url: "https://github.com/x/y" });
      const saved = await as(ben, (c) => c.query("select category, hours, status from roles where project_id = $1 order by created_at", [rows[0].id]));
      expect(saved.rows).toEqual([
        { category: "design", hours: 5, status: "open" },
        { category: "writing", hours: 2, status: "open" },
      ]);
    });

    it("is all-or-nothing: one bad role leaves no project behind", async () => {
      const ben = await newUser("ben@tufts.edu");
      await expect(
        create(ben, "draft", roles([{ category: "design", need: "Redesign three screens", hours: 5 }, { category: "ml", need: "Train it", hours: 99 }])),
      ).rejects.toThrow(/check constraint/);
      const left = await admin("select count(*)::int as n from projects");
      expect(left.rows[0].n).toBe(0);
    });

    it("needs 1 to 5 roles and only creates drafts or published projects", async () => {
      const ben = await newUser("ben@tufts.edu");
      const one = { category: "design", need: "Redesign three screens", hours: 5 };
      await expect(create(ben, "draft", roles([]))).rejects.toThrow(/at least one role/);
      await expect(create(ben, "draft", roles(Array(6).fill(one)))).rejects.toThrow(/Up to 5 roles/);
      await expect(create(ben, "archived", roles([one]))).rejects.toThrow(/draft or published/);
      const left = await admin("select count(*)::int as n from projects");
      expect(left.rows[0].n).toBe(0);
    });

    it("can't be called signed out", async () => {
      await expect(create(null, "draft", roles([{ category: "design", need: "Redesign three screens", hours: 5 }]))).rejects.toThrow(
        /permission denied/,
      );
    });
  });

  describe("offers", () => {
    it("lets students offer on others' open roles, once", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);

      await offer(maya, roleId);
      await expect(offer(maya, roleId)).rejects.toThrow(/duplicate key/);
      await expect(offer(ben, roleId)).rejects.toThrow(/row-level security/); // own project
    });

    it("can't offer on a draft project", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben, "draft");
      await expect(offer(maya, roleId)).rejects.toThrow(/row-level security/);
    });

    it("shows an offer only to the helper and the project owner", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      await offer(maya, roleId);

      const count = async (id: string) => (await as(id, (c) => c.query("select id from offers"))).rowCount;
      expect(await count(ben)).toBe(1);
      expect(await count(maya)).toBe(1);
      expect(await count(theo)).toBe(0);
    });

    it("accepting puts the role in progress and declines competing offers", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      const mayaOffer = await offer(maya, roleId);
      const theoOffer = await offer(theo, roleId);

      await expect(as(maya, (c) => c.query("select accept_offer($1)", [mayaOffer]))).rejects.toThrow(/Only the project owner/);
      await as(ben, (c) => c.query("select accept_offer($1)", [mayaOffer]));

      const { rows } = await admin("select id, status from offers order by status");
      expect(Object.fromEntries(rows.map((r) => [r.id, r.status]))).toEqual({ [mayaOffer]: "accepted", [theoOffer]: "declined" });
      const role = await admin("select status, helper_id from roles where id = $1", [roleId]);
      expect(role.rows[0]).toEqual({ status: "in_progress", helper_id: maya });
      await expect(as(ben, (c) => c.query("select accept_offer($1)", [theoOffer]))).rejects.toThrow(/no longer pending/);
    });

    it("only the helper can withdraw their own pending offer", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);

      await expect(as(ben, (c) => c.query("select withdraw_offer($1)", [id]))).rejects.toThrow(/Only the person/);
      await as(maya, (c) => c.query("select withdraw_offer($1)", [id]));
      const { rows } = await admin("select status from offers where id = $1", [id]);
      expect(rows[0].status).toBe("withdrawn");
    });

    it("lets a helper send a withdrawn offer again, after an hour and at most twice", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);
      const resend = (who: string, note = "Free again this weekend, still keen.") => as(who, (c) => c.query("select resend_offer($1, $2)", [id, note]));
      const withdrawHourAgo = async () => {
        await as(maya, (c) => c.query("select withdraw_offer($1)", [id]));
        await admin("update offers set decided_at = now() - interval '61 minutes' where id = $1", [id]);
      };

      await expect(resend(maya)).rejects.toThrow(/Only a withdrawn offer/);
      await as(maya, (c) => c.query("select withdraw_offer($1)", [id]));
      await expect(resend(maya)).rejects.toThrow(/an hour after withdrawing/);
      await admin("update offers set decided_at = now() - interval '61 minutes' where id = $1", [id]);
      await expect(resend(ben)).rejects.toThrow(/Only the person/);
      await expect(resend(maya, "short")).rejects.toThrow(/10 to 600/);

      await resend(maya);
      const { rows } = await admin("select status, note, decided_at, resend_count, resent_at from offers where id = $1", [id]);
      expect(rows[0]).toMatchObject({ status: "pending", note: "Free again this weekend, still keen.", decided_at: null, resend_count: 1 });
      expect(rows[0].resent_at).not.toBeNull();

      await withdrawHourAgo();
      await resend(maya);
      await withdrawHourAgo();
      await expect(resend(maya)).rejects.toThrow(/twice/);
    });

    it("won't resend once the role is no longer open, and users can't edit offers directly", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      const mayaOffer = await offer(maya, roleId);
      const theoOffer = await offer(theo, roleId);
      await as(maya, (c) => c.query("select withdraw_offer($1)", [mayaOffer]));
      await admin("update offers set decided_at = now() - interval '2 hours' where id = $1", [mayaOffer]);
      await as(ben, (c) => c.query("select accept_offer($1)", [theoOffer]));

      await expect(as(maya, (c) => c.query("select resend_offer($1, $2)", [mayaOffer, "I could still help out here."]))).rejects.toThrow(
        /isn't taking offers/,
      );
      // No UPDATE policy on offers: the counter and status can only change through the functions.
      const res = await as(maya, (c) => c.query("update offers set resend_count = 0, status = 'pending' where id = $1", [mayaOffer]));
      expect(res.rowCount).toBe(0);
    });
  });

  describe("deleting an account", () => {
    it("removes only the caller and everything they made", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const { roleId: mayaRole } = await newProject(maya);
      const id = await offer(maya, roleId);
      await offer(ben, mayaRole);
      await as(maya, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'hi')", [id, maya]));

      await as(maya, (c) => c.query("select delete_my_account()"));

      const count = async (sql: string) => (await admin(sql)).rows[0].n as number;
      expect(await count(`select count(*)::int as n from auth.users where id = '${maya}'`)).toBe(0);
      expect(await count(`select count(*)::int as n from profiles where id = '${maya}'`)).toBe(0);
      expect(await count("select count(*)::int as n from offers")).toBe(0); // her offer, and Ben's offer on her project
      expect(await count("select count(*)::int as n from messages")).toBe(0);
      expect(await count(`select count(*)::int as n from projects where owner_id = '${ben}'`)).toBe(1);
      expect(await count(`select count(*)::int as n from auth.users where id = '${ben}'`)).toBe(1);

      await expect(as(null, (c) => c.query("select delete_my_account()"))).rejects.toThrow(/permission denied/);
    });
  });

  describe("full-project roles", () => {
    it("allow bigger estimates than regular roles", async () => {
      const ben = await newUser("ben@tufts.edu");
      const { projectId } = await newProject(ben);
      const addRole = (category: string, hours: number) =>
        as(ben, (c) => c.query("insert into roles (project_id, category, need, hours) values ($1, $2, 'Build it with me', $3)", [projectId, category, hours]));

      await addRole("fullstack", 120);
      await expect(addRole("fullstack", 121)).rejects.toThrow(/roles_hours_check/);
      await addRole("backend", 40);
      await expect(addRole("backend", 41)).rejects.toThrow(/roles_hours_check/);
      const { rows } = await admin("select category::text from open_roles where category::text = 'fullstack'");
      expect(rows).toHaveLength(1);
    });
  });

  describe("example project", () => {
    it("shows the example in the feed until 3 real projects are published, and never takes offers", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { projectId: exampleId, roleId: exampleRole } = await newProject(ben);
      await admin("update projects set is_example = true where id = $1", [exampleId]);
      const feed = async () => (await as(maya, (c) => c.query("select project_id, is_example from open_roles"))).rows;

      expect(await feed()).toEqual([{ project_id: exampleId, is_example: true }]);
      await expect(offer(maya, exampleRole)).rejects.toThrow(/row-level security/);

      // Drafts don't count; the example stays alongside the first two real projects and goes with the third.
      const { projectId: draftId } = await newProject(maya, "draft");
      expect((await feed()).map((r) => r.project_id)).toEqual([exampleId]);
      const ids = (rows: { project_id: string }[]) => rows.map((r) => r.project_id).sort();
      await as(maya, (c) => c.query("update projects set status = 'published' where id = $1", [draftId]));
      const { projectId: second } = await newProject(maya);
      expect(ids(await feed())).toEqual([exampleId, draftId, second].sort());
      const { projectId: third } = await newProject(maya);
      expect(ids(await feed())).toEqual([draftId, second, third].sort());
    });

    it("can't be set by students", async () => {
      const ben = await newUser("ben@tufts.edu");
      const { projectId } = await newProject(ben);
      await expect(as(ben, (c) => c.query("update projects set is_example = true where id = $1", [projectId]))).rejects.toThrow(/row-level security/);
      await expect(
        as(ben, (c) =>
          c.query("insert into projects (owner_id, title, pitch, stage, is_example) values ($1, 'Fake', 'Pretend this is an example.', 'idea', true)", [ben]),
        ),
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("unread conversations", () => {
    it("flags new offers and messages from the other person until the conversation is opened", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);
      const unread = async (who: string) => (await as(who, (c) => c.query("select unread_offer_ids() as id"))).rows.map((r) => r.id);
      const open = (who: string) => as(who, (c) => c.query("select mark_thread_read($1)", [id]));
      const say = (who: string) => as(who, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'hi')", [id, who]));

      // A new offer is unread for the owner, not for the helper who sent it.
      expect(await unread(ben)).toEqual([id]);
      expect(await unread(maya)).toEqual([]);
      await open(ben);
      expect(await unread(ben)).toEqual([]);

      // Your own messages never count; theirs do until you open the conversation.
      await say(ben);
      expect(await unread(ben)).toEqual([]);
      expect(await unread(maya)).toEqual([id]);
      await open(maya);
      expect(await unread(maya)).toEqual([]);

      // Outsiders see nothing and can't create read markers.
      expect(await unread(theo)).toEqual([]);
      await open(theo);
      const { rows } = await admin("select count(*)::int as n from thread_reads where user_id = $1", [theo]);
      expect(rows[0].n).toBe(0);
      await expect(as(maya, (c) => c.query("insert into thread_reads (user_id, offer_id) values ($1, $2)", [maya, id]))).rejects.toThrow(/permission denied/);
    });
  });

  describe("reports and blocks", () => {
    it("lets someone in a conversation report it once, and only see their own reports", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);
      const report = (who: string) => as(who, (c) => c.query("select report_conversation($1, 'harassment', 'Rude messages')", [id]));

      await expect(report(theo)).rejects.toThrow(/conversations you're in/);
      await report(ben);
      await expect(report(ben)).rejects.toThrow(/already reported/);
      const { rows } = await admin("select reporter_id, reported_id, reason from reports");
      expect(rows).toEqual([{ reporter_id: ben, reported_id: maya, reason: "harassment" }]);

      expect((await as(maya, (c) => c.query("select * from reports"))).rowCount).toBe(0);
      await expect(as(ben, (c) => c.query("insert into reports (reporter_id, reported_id, reason) values ($1, $2, 'spam')", [ben, maya]))).rejects.toThrow(
        /permission denied/,
      );
    });

    it("blocking closes the conversation both ways, closes pending offers and stops new ones", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const { roleId: mayaRole } = await newProject(maya);
      const id = await offer(maya, roleId);
      const benOffer = await offer(ben, mayaRole);
      const say = (who: string) => as(who, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'hi')", [id, who]));

      await say(ben);
      await as(ben, (c) => c.query("select block_in_conversation($1)", [id]));
      await expect(say(maya)).rejects.toThrow(/row-level security/);
      await expect(say(ben)).rejects.toThrow(/row-level security/);
      const statuses = await admin("select id, status from offers");
      expect(Object.fromEntries(statuses.rows.map((r) => [r.id, r.status]))).toEqual({ [id]: "declined", [benOffer]: "withdrawn" });

      // Maya can't see the block, and can't offer on Ben's other roles.
      expect((await as(maya, (c) => c.query("select * from blocks"))).rowCount).toBe(0);
      const other = await as(ben, async (c) => {
        const { rows } = await c.query("select project_id from roles where id = $1", [roleId]);
        return (await c.query("insert into roles (project_id, category, need, hours) values ($1, 'backend', 'Set up the API', 4) returning id", [rows[0].project_id])).rows[0].id as string;
      });
      await expect(offer(maya, other)).rejects.toThrow(/row-level security/);
      await expect(as(maya, (c) => c.query("select blocked_between($1, $2)", [ben, maya]))).rejects.toThrow(/permission denied/);

      await as(ben, (c) => c.query("select unblock_in_conversation($1)", [id]));
      await offer(maya, other);
    });
  });

  describe("messages", () => {
    it("caps a helper at 5 unanswered messages on a pending offer, until the owner replies", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);
      const say = (who: string) => as(who, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'hello?')", [id, who]));

      for (let i = 0; i < 5; i++) await say(maya);
      await expect(say(maya)).rejects.toThrow(/up to 5 messages/);

      await say(ben);
      await say(maya);
      const { rows } = await admin("select count(*)::int as n from messages where offer_id = $1", [id]);
      expect(rows[0].n).toBe(7);
    });

    it("lifts the cap once the offer is accepted", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);
      const say = () => as(maya, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'update')", [id, maya]));
      for (let i = 0; i < 5; i++) await say();
      await as(ben, (c) => c.query("select accept_offer($1)", [id]));
      await say();
      await say();
    });

    it("lets only the two people in a conversation read and write it", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);

      const send = (who: string, from: string) =>
        as(who, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'hi')", [id, from]));
      await send(maya, maya);
      await send(ben, ben);
      await expect(send(theo, theo)).rejects.toThrow(/row-level security/);
      await expect(send(maya, ben)).rejects.toThrow(/row-level security/); // can't send as someone else

      const read = async (who: string) => (await as(who, (c) => c.query("select id from messages"))).rowCount;
      expect(await read(maya)).toBe(2);
      expect(await read(ben)).toBe(2);
      expect(await read(theo)).toBe(0);
    });

    it("closes the conversation when an offer is declined", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);
      await as(ben, (c) => c.query("select decline_offer($1)", [id]));
      await expect(
        as(maya, (c) => c.query("insert into messages (offer_id, sender_id, body) values ($1, $2, 'still there?')", [id, maya])),
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("credits", () => {
    it("are written when the owner marks the role filled, and visible to everyone signed in", async () => {
      const ben = await newUser("ben@tufts.edu");
      const maya = await newUser("maya@tufts.edu");
      const theo = await newUser("theo@tufts.edu");
      const { roleId } = await newProject(ben);
      const id = await offer(maya, roleId);

      await expect(as(ben, (c) => c.query("select complete_role($1, 5::smallint, 'Great work')", [roleId]))).rejects.toThrow(
        /Accept an offer/,
      );
      await as(ben, (c) => c.query("select accept_offer($1)", [id]));
      await as(ben, (c) => c.query("select complete_role($1, 5::smallint, 'Redid all three screens in a weekend.')", [roleId]));

      const credit = await as(theo, (c) => c.query("select helper_id, hours, note from credits"));
      expect(credit.rows).toEqual([{ helper_id: maya, hours: 5, note: "Redid all three screens in a weekend." }]);
      await expect(
        as(maya, (c) => c.query("insert into credits (role_id, helper_id, hours, note) values ($1, $2, 40, 'self-credit')", [roleId, maya])),
      ).rejects.toThrow(/row-level security/);
    });
  });
});
