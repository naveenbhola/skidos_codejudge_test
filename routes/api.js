var express = require('express');
var router = express.Router();

const games = [];

router.post('/onboard', function(req, res, next) {
 
  try {

    const {lane_number, players} = req.body;
    if(!lane_number || typeof lane_number !== 'number') {
      throw new Error ('Lane number is required');
    }
    if(lane_number< 0) {
      throw new Error('Lane number must be non-negative');
    }

    if(!players || !Array.isArray(players) || players.length === 0) {
      throw new Error('At least one player is required');
    }

    const playerDetails = [];
    const playerDetailsOutput = [];


    players.forEach((player,index) => {
      if(!player.name || typeof player.name !== 'string') {
        throw new Error('Invalid name for player at index ${indedx}');
      }

      const newPlayer = {
        id: index+1,
        name: player.name
      };

      playerDetails.push({player:newPlayer, "sets" : [], "current_score": 0 });
      playerDetailsOutput.push({player:newPlayer});

    });
    const game = {
      
        id: games.length+1,
        lane_number,
        "player_details": playerDetails
    };

    const gameoutput = {
      
        id: game.id,
        lane_number,
      "player_details": playerDetailsOutput,
    };
    games.push(game);
    res.status(201).json(
        { 
            "game": {
                id: gameoutput.id,
                lane_number: gameoutput.lane_number,
            },
            "player_details": gameoutput.player_details
        }
    );

  } catch (error) {
    res.status(400).json({error: error.message});
  }
 
});


const result = {};
const updatePlayer = (player, game_id, player_id, pinsHitCount, total_throws_count) => {

    if(result[game_id] == undefined) {
        result[game_id] = {};
    }

    if(result[game_id][player_id] == undefined) {
        result[game_id][player_id] = {'throws_count':0, 'last_throw_count':0};
    }
    
    if(result[game_id][player_id]['throws_count'] %2 === 0) {
        
        if(pinsHitCount < 10) {
            result[game_id][player_id]['throws_count']++;
            result[game_id][player_id]['last_throw_count'] = pinsHitCount;
            player.current_score = player.current_score + pinsHitCount;
            if(result[game_id][player_id]['throws_count'] <= total_throws_count) {
                player.sets.push({strategy_name : 'SIMPLE'});
            }
            

        } else  if(pinsHitCount === 10) {
            result[game_id][player_id]['throws_count'] = result[game_id][player_id]['throws_count'] + 2;
            result[game_id][player_id]['last_throw_count'] = 0;

            player.current_score = player.current_score + 10 + 10;
            if(result[game_id][player_id]['throws_count'] <= total_throws_count) {
                player.sets.push({strategy_name : 'STRIKE'});
            }
        }

    } else {
        result[game_id][player_id]['throws_count']++;

        const set_complete_score = result[game_id][player_id]['last_throw_count'] + pinsHitCount;

        if(set_complete_score === 10) {
            player.current_score = player.current_score + pinsHitCount + 5;

            if(result[game_id][player_id]['throws_count'] <= total_throws_count) {
                const lastSet = player.sets[player.sets.length-1];
                lastSet.strategy_name = 'SPARE';
            }
        } else {
            player.current_score = player.current_score + pinsHitCount;
        }
        result[game_id][player_id]['last_throw_count'] = 0;
        
    }

};

router.post('/play', function(req, res, next) {
 
      try {
    
        const {game_id, player_id, pins_hit_count} = req.body;
        if(!game_id || typeof game_id !== 'number') {
          throw new Error ('Lane number is required');
        }

        if(!player_id || typeof player_id !== 'number') {
            throw new Error ('Player Id is required');
        }

        if(!pins_hit_count || typeof pins_hit_count !== 'number' || pins_hit_count < 0 || pins_hit_count > 10) {
            throw new Error ('Pines hit count is required');
        }
        const game = games.find(g => g.id === game_id);

        if(!game) {
            throw new Error ('game not found');
        }

        const player = game.player_details.find(p => p.player.id === player_id)
        if(!player) {
            throw new Error ('Player not found');
        }

        let total_throws_count = 10*game.player_details.length;
        updatePlayer(player, game_id, player_id, pins_hit_count, total_throws_count);

        const output = { 
            "game": {
                id: game.id,
                lane_number: game.lane_number,
            },
            "player_details": game.player_details
        };
       
        res.status(200).json(
            output
        );


    } catch(error) {
        if(error.message === 'game not found' || error.message === 'Player not found') {
            res.status(404).json({error: error.message});
        } else {
            res.status(400).json({error: error.message});
        }

    }

});






module.exports = router;
