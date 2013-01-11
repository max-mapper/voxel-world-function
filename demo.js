var createGame = require('voxel-engine')
var voxel = require('voxel')
var toolbar = require('toolbar')

var textarea = document.querySelector('textarea')
var defaultFunction = "var s = 2.0 * Math.PI / 32.0;\nreturn Math.sin(s * x) + Math.sin(s * y) + Math.sin(s * z) < 0 ? 1 : 0;"
textarea.value = defaultFunction

document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault()
  var begin = "function evalFunc(x, y, z) {"
  var end = "}"
  eval(begin + textarea.value + end)
  window.userFunction = evalFunc
  var element = document.querySelector(".functionInput")
  element.parentNode.removeChild(element)
  setTimeout(startGame, 0)
  return false
})

function startGame() {
  window.blockSelector = toolbar({el: '#tools'})
  
  var generator = function(low, high, x, y, z) {
    var chunkIndex = [x, y, z].join('|')
    var chunk = this.chunks[chunkIndex]
    var voxels
    if (chunk) voxels = chunk.voxels
    return voxel.generate(low, high, function(vx, vy, vz, n) {
      if (voxels) return voxels[n]
      return userFunction(vx, vy, vz)
    })
  }
  
  window.game = createGame({
    generateVoxelChunk: generator,
    texturePath: './textures/',
    materials: ['grass', 'brick', 'dirt', 'obsidian', 'crate'],
    cubeSize: 25,
    chunkSize: 32,
    chunkDistance: 1,
    startingPosition: [35, 2024, 35],
    worldOrigin: [0,0,0],
    controlOptions: {jump: 6}
  })
  
  game.controls.pitchObject.rotation.x = -1.5

  var currentMaterial = 1

  blockSelector.on('select', function(material) {
    var idx = game.materials.indexOf(material)
    if (idx > -1) currentMaterial = idx + 1
  })

  game.on('collision', function (item) {
    game.removeItem(item)
  })

  function createDebris (pos, value) {
    var mesh = new game.THREE.Mesh(
      new game.THREE.CubeGeometry(4, 4, 4),
      game.material
    )
    mesh.geometry.faces.forEach(function (face) {
      face.materialIndex = value - 1
    })
    mesh.translateX(pos.x)
    mesh.translateY(pos.y)
    mesh.translateZ(pos.z)

    return {
      mesh: mesh,
      size: 4,
      collisionRadius: 22,
      value: value
    }
  }

  function explode (pos, value) {
    if (!value) return
    var item = createDebris(pos, value)
    item.velocity = {
      x: (Math.random() * 2 - 1) * 0.05,
      y: (Math.random() * 2 - 1) * 0.05,
      z: (Math.random() * 2 - 1) * 0.05,
    }
    game.addItem(item)
    setTimeout(function (item) {
      game.removeItem(item)
    }, 15 * 1000 + Math.random() * 15 * 1000, item)
  }

  game.appendTo('#container')

  game.on('mousedown', function (pos) {
    var cid = game.voxels.chunkAtPosition(pos)
    var vid = game.voxels.voxelAtPosition(pos)
    if (erase) {
      explode(pos, game.getBlock(pos))
      game.setBlock(pos, 0)
    } else {
      game.createBlock(pos, currentMaterial)
    }
  })

  var erase = true
  window.addEventListener('keydown', function (ev) {
    if (ev.keyCode === 'X'.charCodeAt(0)) {
      erase = !erase
    }
  })

  function ctrlToggle (ev) { erase = !ev.ctrlKey }
  window.addEventListener('keyup', ctrlToggle)
  window.addEventListener('keydown', ctrlToggle)

  game.requestPointerLock('canvas')
}
