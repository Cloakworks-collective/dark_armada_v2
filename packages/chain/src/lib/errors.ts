export namespace Errors {
    // generic errors
    export const INVALID_KEY = 'Not the correct key';
    export const PLAYER_HAS_NO_ACCESS =
      'This player has no access to this planet';
  
    // create a new planet error messages
    export const COORDINATE_OUT_OF_RANGE = 'Coordinate out of range';
    export const PLANET_ALREADY_EXISTS_AT_THIS_LOCATION =
      'A homeworld has already been created at this location';
    export const COORDINATE_NOT_SUITABLE =
      'Coordinate not suitable for planet creation';
    export const INVALID_FACTION = 'Invalid faction';
    export const PLAYER_HAS_PLANET = 'Player already has a home planet';
  
    // set defense error messages
    export const PLANET_DOES_NOT_EXIST_HERE = 'Planet does not exist here';
    export const DEFENSE_CREW = 'You do not have enough crew to man defense';
  
    // launch attack error messages
    export const PLANET_UNDER_ATTACK = 'Planet is already under attack';
    export const ATTACKER_HAS_NO_DEFENSE = 'Attacking home planet has no defense';
    export const DEFENDER_HAS_NO_DEFENSE = 'Defending planet has no planetary defense';
    export const ATTACK_FLEET_STRENGTH = 'Attack Fleet cost too high';
    export const CANNOT_ATTACK_OWN_PLANET =
      'Player cannot attack their own planet';
    export const INVALID_ATTACKER_DETAILS = 'Invalid attacker details';
    export const INVALID_ATTACK_FACTION = 'Attacking fleet faction does not match with the attacking planet faction';
  
    // resolve attack error messages
    export const ATTACK_DOES_NOT_MATCH = 'Attack does not match';
    export const DEFENSE_DOES_NOT_MATCH = 'Defense does not match';
    export const NO_DEFENDING_PLANET_FOUND = 'No defending planet found';
    export const NO_ATTACKER_HOMEWORLD = 'No attacker homeworld found';
  
    // forfeit error messages
    export const NOT_ATTACKER = 'Only the attacker can claim the forfeit';
    export const FORFEIT_CLAIM_DURATION =
      'Forfeit can not be claimed before claim duration passed';
  
    export const INVALID_PLANET_DETAILS = 
      'Invalid planet details, information out of sync with Merkle tree';  
  }