# Cello practice companion — project brief

**Status:** First draft, based on the user's description  
**Working name:** Cello Practice Companion

## Purpose

Help a beginner cellist keep track of all their exercises, decide what to practice today, and see which areas they have practiced recently. The app offers information and gentle prompts; the player always chooses what to practice.

## The problem

Practice includes different kinds of work: scales, left-hand exercises, bowing, pieces, and new assignments after a lesson. There are too many exercises to do every day. Without a simple record, it is hard to remember what has received attention and what has quietly fallen away.

## Product principles

- **Choice stays with the player.** No required schedule, quotas, or automatic assignment.
- **Logging stays light.** Mark an exercise as practiced on a day. Time tracking and detailed notes are optional future additions.
- **Show the evidence.** Display practice frequency and recency clearly, without scoring or judging it.
- **Keep the next action obvious.** It should be quick to find an exercise, add it to today's list, and mark it done.

## Core user story

> As a beginner cellist, I want to see my exercises grouped by practice area and review when I last practiced them, so I can choose today's practice with a better sense of what I have been doing recently.

Supporting stories:

1. As a player, I can add, edit, archive, and categorize exercises so my full practice list stays useful as lessons change.
2. As a player, I can make a flexible list for today without committing to a fixed schedule.
3. As a player, I can mark an exercise practiced with one action, and correct an accidental mark.
4. As a player, I can see the last practiced date and the number of days practiced in the past 7 and 30 days for each exercise and practice area.
5. As a player, I can see recent history so I can understand the numbers and remember what I actually did.

## First version: screens and behavior

### 1. Today

- Show today's selected exercises and whether each has been practiced today.
- Add or remove exercises from today's list at any time.
- Mark an exercise practiced directly from the list.
- The list is a convenience, not a requirement: an exercise can be logged from the library without adding it first.
- Unfinished items do not become overdue tasks. Start each day with a fresh list; yesterday's activity remains in history.

### 2. Exercise library

- Add an exercise with a name and one primary practice area.
- Start with suggested areas: **Scales**, **Left hand**, **Bowing**, **Pieces**, and **Other**. Allow the player to rename, add, and remove areas.
- Browse or search all active exercises, grouped by area.
- Show each exercise's last practiced date and recent frequency.
- Archive exercises that are no longer current without deleting their history.

### 3. Overview

- For each area, show the number of distinct days practiced in the past 7 and 30 days and the most recent practice date.
- Show the same facts for individual exercises.
- Make less recently practiced areas easy to spot with neutral wording, such as “Last practiced 12 days ago.”
- Do not assign a score, target, streak, or mandatory recommendation.

### 4. History

- Show practice by date, listing the exercises practiced on each day.
- Allow correction of accidental entries.
- Count an exercise at most once per day. Frequency means **days practiced**, not taps or minutes.

## Example experience

After a lesson, the player adds a new bowing exercise to the library. On a practice day, they look at the overview: bowing was practiced once in the last 7 days, while scales were practiced four days. They decide to put the bowing exercise and a piece on today's list. After practicing, they mark both done. The overview and history update immediately.

## Acceptance criteria for the first version

- A new user can create an area and exercise, choose an exercise for today, and log it without entering a duration.
- Logging an exercise updates its last practiced date and 7-day and 30-day counts, plus the corresponding area's counts.
- An area's count measures distinct calendar days with at least one logged exercise in that area.
- Removing an exercise from today's list does not erase its practice history.
- Deleting an accidental log updates the overview and history correctly.
- Archived exercises disappear from the active library but remain in historical records.
- The app works well on a phone-sized screen, where it is likely to be used during practice.

## Proposed build plan

1. **Confirm the experience.** Agree on the few open decisions below and sketch the Today, Library, Overview, and History screens.
2. **Build the practice library.** Create and manage areas and exercises, including archiving.
3. **Build today's flow.** Select exercises, mark them practiced, and allow corrections.
4. **Build the overview and history.** Calculate distinct practice days and display 7-day, 30-day, and last-practiced information.
5. **Polish and validate.** Test the complete flow with realistic exercises and several weeks of sample history; refine the phone layout and wording.

Each step can be assigned as a separate agent task once the product decisions are settled. The first usable release is complete after step 4; step 5 prepares it for regular use.

## Later possibilities, outside the first version

- Pin a temporary “lesson focus” area or exercise for the current week.
- Add optional notes to a practice entry, such as a teacher's instruction or what felt difficult.
- Offer a gentle “you have not practiced this recently” view, without automatically choosing exercises.
- Export or back up practice data.

## Decisions to make before implementation

1. **Where should it live?** A phone-friendly web app is the default proposal. A native phone app is possible if offline access or phone-specific features matter.
2. **How should data be saved?** The simplest prototype can save on one device. Account sync and backup need a later decision if the app will be used across devices.
3. **Lesson focus:** Should a temporary weekly focus be in the first version, or is the flexible Today list enough at the start?
