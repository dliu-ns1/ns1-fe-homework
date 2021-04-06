'use strict';
/* globals _, engine */
window.initGame = function () {
  console.log('initgame');
    // you're really better off leaving this line alone, i promise.
  const command =
    '5 3 \n 1 1 s\n ffffff\n 2 1 w \n flfffffrrfffffff\n 0 3 w\n LLFFFLFLFL';
  // Capture the last position, orientation, and commands of each lost robots
  const lostRobos = [];

    // this function parses the input string so that we have useful names/parameters
    // to define the playfield and robots for subsequent steps
  const parseInput = (input) => {
        //
        // task #1 
        //
        // replace the 'parsed' variable below to be the string 'command' parsed into an object we can pass to genworld();
        // genworld expects an input object in the form { 'bounds': [3, 8], 'robos': [{x: 2, y: 1, o: 'W', command: 'rlrlff'}]}
        // where bounds represents the southeast corner of the plane and each robos object represents the
        // x,y coordinates of a robot and o is a string representing their orientation. a sample object is provided below
        //

        // replace this with a correct object
    const coordinateRange = "([0-9]|[1-4][0-9]|50)";
    const cardinalDirection = "(n|w|s|e)";
    const initialRobotCmd =
      `(${coordinateRange} ${coordinateRange} ${cardinalDirection}\\s)`;

    const boundsRegex = new RegExp(
      `(${coordinateRange} ${coordinateRange} \n)`,
      'g'
    );
    const robotRegex = new RegExp(
      `${initialRobotCmd}` +
      `(.|\\s)*?` +
      `(?=${initialRobotCmd}|$)`,
      'gi'
    );

    const bounds = input
      .match(boundsRegex)[0]
      .replace(/\s*$/, '')
      .split(' ')
      .map(n => +n);
    const robos = input
      .match(robotRegex)
      .map(robo => {
        const [initialPos, command] = robo
          .trim()
          .replace(/\s*\n\s*/, '\n')
          .split('\n');
        const [x, y, o] = initialPos
          .split(' ')
          .map(val =>
            new RegExp(coordinateRange, 'g').test(val) ? +val : val.toUpperCase()
          );

        return { x, y, o, command: command.toLowerCase() };
      });

    return { bounds, robos };
  };

  /**
   * Checks if x, y, and o against of list lost robots, then
   * return true or false if x, y, and o matches any of the lost robots' info.
   *
   * @param {obj} Object containing x, y, o to check against the list of lost robots
   * @param {arr} lostRobos, a list of lost robots containing x, y, o info
   * @returns {bool}
   */
  const isLostRoboScentPresent = ({ x, y, o }, lostRobos) => {
    return lostRobos.reduce((flag, robo) => {
      if (x === robo.x && y === robo.y && o === robo.o) {
        flag = true;
      }
      return flag;
    }, false);
  }

  /**
   * Updates X-Y positions based on cardinal direction
   *          North
   *          y-=1
   * West               East
   * x-=1               x+=1
   *          South
   *          y+=1
   *
   * However, if the current position and orientation matches any of the lost
   * robots' scent, then the x-y position remains the same.
   *
   * @param {obj}   Object containing "x"-"y" (int) coordinates and
   *                "o" (str) cardinal directions
   * @returns {obj} Object containing updated "x"-"y" (int) coordinates
   */
  const updatePositions = ({ x, y, o }, lostRobos) => {
    if (isLostRoboScentPresent({ x, y, o }, lostRobos)) {
      return { x, y };
    }

    switch (o) {
      case 'N':
        y -= 1;
        break;
      case 'W':
        x -= 1;
        break;
      case 'S':
        y += 1;
        break;
      case 'E':
        x += 1;
        break;
    };

    return { x, y };
  };

  /**
   * Updates cardinal direction based on the single command input
   *        [N, W, S, E]
   *      R <-        -> L
   *
   * Keep in mind, if current direction is "N" or "E", it loops around the array.
   * ie. N => E when command is "R" or E => N when command is "L"
   *
   * @param {obj} Object containing "o" (str) cardinal direction and
   *              "command" (str) containing list of commands
   * @returns {str} Updated cardinal direction
   */
  const updateOrientation = ({ o, command }) => {
    const [firstCmd] = command;
    const cardinalDirections = ['N', 'W', 'S', 'E'];
    const index = cardinalDirections.indexOf(o);

    switch (firstCmd) {
      case 'l':
        o =
          cardinalDirections[index + 1 >= cardinalDirections.length ? 0 : index + 1];
        break;
      case 'r':
        o =
          cardinalDirections[index - 1 < 0 ? cardinalDirections.length - 1 : index - 1];
        break;
    }

    return o;
  }

  /**
   * Determine if the next potential x-y coordinates are valid
   *
   * @param {obj} Object containing "bounds" (arr) of the grid and
   *              the next potential "x" & "y" coordinates
   * @returns {bool}
   */
  const isWithinGrid = ({ bounds, x, y }) => {
    return x >= 0 && y >= 0 && x <= bounds[0] && y <= bounds[1];
  };

  /**
   * Execute a single command from the "robo" command string and update the X-Y
   * coordinates or the orientation.
   *
   * Depending on command, bounds, and the scent of lost robots, commands will be
   * ignored and X-Y coordinates remains the same. If the command navigates the robo
   * off the grid, it will return undefined and populate the last position &
   * orientation to "lostRobos" array.
   *
   * @param {obj} robo  Object containing X-Y coordinates (int),
   *                    "o"rientation (str), and command string (str)
   * @param {arr} lostRobos List of robos that went off the grid
   * @param {arr} bounds X-Y bounds of the grid
   * @returns {obj|undefined} Returns updated "robo" object or undefined
   */
  const executeSingleRoboCmd = (robo, lostRobos, bounds) => {
    const [firstCmd] = [...robo.command];

    switch (firstCmd) {
      case 'f': {
        const { x, y } = updatePositions(robo, lostRobos);

        if (isWithinGrid({ bounds, x, y })) {
          robo = { ...robo, x, y };
        } else {
          lostRobos.push(robo);
          robo = undefined;
        }

        break;
      }
      case 'l':
      case 'r': {
        const o = updateOrientation(robo);

        robo = { ...robo, o };

        break;
      }
    }
    return robo ? { ...robo, command: robo.command.substring(1) } : undefined;
  }

    // this function replaces the robos after they complete one instruction
    // from their commandset
  const tickRobos = (robos) => {
    console.log('tickrobos');
        // 
        // task #2
        //
        // in this function, write business logic to move robots around the playfield
        // the 'robos' input is an array of objects; each object has 4 parameters.
        // This function needs to edit each robot in the array so that its x/y coordinates
        // and orientation parameters match the robot state after 1 command has been completed. 
        // Also, you need to remove the command the robot just completed from the command list.
        // example input:
        //
        // robos[0] = {x: 2, y: 2, o: 'N', command: 'frlrlrl'}
        //
        //                   - becomes -
        // 
        // robos[0] = {x: 2, y: 1, o: 'N', command: 'rlrlrl'} 
        //
        // if a robot leaves the bounds of the playfield, it should be removed from the robos
        // array. It should leave a 'scent' in it's place. If another robot–for the duration
        // of its commandset–encounters this 'scent', it should refuse any commands that would
        // cause it to leave the playfield.

        // write robot logic here

        // return the mutated robos object from the input to match the new state
        // return ???;
    const { bounds } = parseInput(command);

    return robos
      .map(robo => executeSingleRoboCmd(robo, lostRobos, bounds))
      .filter(robo => robo);
  };

  /**
   * Populate the unordered list node using textTemplateFn and the contents
   * within robo
   *
   * @param {obj} robo object containing x, y, o information
   * @param {dom-node} ulDom <ul> DOM node object
   * @param {fn} textTemplateFn string interpolation function that takes in {x,y,o}
   */
  const populateRoboListDom = (robo, ulDom, textTemplateFn) => {
    const liEl = document.createElement('li');
    const textContentNode = document.createTextNode(textTemplateFn(robo));

    liEl.appendChild(textContentNode);
    ulDom.appendChild(liEl);

    return;
  };

    // mission summary function
  const missionSummary = (robos) => {
        //
        // task #3
        //
        // summarize the mission and inject the results into the DOM elements referenced in readme.md
        //
    const robosListEl = document.getElementById("robots");
    robos.forEach(robo =>
      populateRoboListDom(
        robo,
        robosListEl,
        ({ x, y, o }) => `Position: ${x}, ${y} | Orientation: ${o}`
      )
    );
    
    const lostRobosListEl = document.getElementById("lostRobots");
    lostRobos.forEach(robo =>
      populateRoboListDom(
        robo,
        lostRobosListEl,
        ({ x, y, o }) => `I died going ${o} from coordinates: ${x}, ${y}`
      )
    );

    return;
  };

    // leave this alone please
  return {
    parse: parseInput,
    tick: tickRobos,
    summary: missionSummary,
    command: command
  };
};

