/**
 * The reader profile — everything we might learn about a person to curate a
 * library for them. NOTHING here is required. We take whatever they give us.
 *
 * The design belief: people don't build libraries by profession and subject.
 * They build them for how a room should feel, what a shelf says about them,
 * and the corner they'll actually sit in. So the questions lead with want,
 * setting, look, and feeling — and treat profession as an afterthought.
 */

export type SpaceSize = "shelf" | "bookcase" | "wall" | "room";

export interface ReaderProfile {
  /** What they're hoping the library gives them — the real "why". */
  hope?: string;

  /** Where the library will physically live (and be seen). */
  placement?: string;

  /** How it should look as an object in the room. */
  look?: string;

  /** How it should feel to be near. */
  feel?: string;

  /** How much they want to spend. */
  budget?: string;

  /** How much physical space there is. */
  space?: SpaceSize;

  /** Things they love — topics, people, obsessions. */
  likes: string[];

  /** Books or authors they already treasure. */
  reads: string[];

  /** Where in the world they are (for local flavor, availability). */
  location?: string;

  /** A little about their days. */
  lifestyle?: string;

  /** What they do — asked last, on purpose. */
  profession?: string;
}

/** Approximate book counts implied by each space size, used as a default. */
export const SPACE_TO_TARGET: Record<SpaceSize, number> = {
  shelf: 15,
  bookcase: 50,
  wall: 150,
  room: 400,
};
