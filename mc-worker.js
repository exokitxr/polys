/* importScripts('/archae/plugins/_core_engines_resource/serve/three.js');
const {exports: THREE} = self.module;
importScripts('/archae/assets/murmurhash.js');
const {exports: murmur} = self.module;
importScripts('/archae/assets/autows.js');
const {exports: Autows} = self.module;
importScripts('/archae/assets/alea.js');
const {exports: alea} = self.module;
self.module = {}; */

// let Module = null;
// let slab = null;
/* const NUM_CELLS = 8;
const OVERSCAN = 1;
const NUM_CELLS_OVERSCAN = NUM_CELLS + OVERSCAN;
const NUM_CHUNKS_HEIGHT = 10;                 
const NUM_CELLS_HEIGHT = NUM_CELLS * NUM_CHUNKS_HEIGHT;
const NUM_CELLS_OVERSCAN_Y = NUM_CELLS_HEIGHT + OVERSCAN; */
const width = 10;
const height = 10;
const depth = 10;
// let noiserOffset = 0;
self.wasmModule = (moduleName, moduleFn) => {
  // console.log('wasm module', moduleName, moduleFn);
  if (moduleName === 'mc') {
    self.Module = moduleFn({
      print(text) { console.log(text); },
      printErr(text) { console.warn(text); },
      locateFile(path, scriptDirectory) {
        if (path === 'mc.wasm') {
          return (importScripts.basePath || '') + 'bin/' + path;
        } else {
          return path;
        }
      },
      onRuntimeInitialized: () => {
        loaded = true;
        _flushMessages();
      },
    });

    // console.log('got module', Module);
  } else {
    console.warn('unknown wasm module', moduleName);
  }
};
importScripts('bin/mc.js');

class Allocator {
  constructor() {
    this.offsets = [];
  }
  alloc(constructor, size) {
    const offset = self.Module._doMalloc(size * constructor.BYTES_PER_ELEMENT);
    const b = new constructor(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + offset, size);
    b.offset = offset;
    this.offsets.push(offset);
    return b;
  }
  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      self.Module._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    /* case 'getBiomeColors': {
      // const {x, z} = data;

      const allocator = new Allocator();

      const colors = allocator.alloc(Uint8Array, 300*300*3);

      self.LocalModule._doNoiserGetBiomeColors(
        noiserOffset,
        -150,
        150,
        -150,
        150,
        colors.offset
      );

      self.postMessage({
        result: {
          colors,
        },
      });
      allocator.freeAll();
      break;
    }
    case 'getGeometry': {
      const {x, z} = data;

      const allocator = new Allocator();

      const biomes = allocator.alloc(Uint8Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN);
      const temperature = allocator.alloc(Uint8Array, 1);
      const humidity = allocator.alloc(Uint8Array, 1);
      const elevations = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN);
      const ethers = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN_Y);
      const water = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN_Y);
      const lava = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN_Y);

      self.LocalModule._doNoiserApply(
        noiserOffset,
        x,
        z,
        biomes.offset,
        temperature.offset,
        humidity.offset,
        1,
        elevations.offset,
        1,
        ethers.offset,
        1,
        water.offset,
        lava.offset,
        1,
        0,
        0
      );

      const positions = allocator.alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);
      const faces = allocator.alloc(Uint32Array, 1024*1024/Uint32Array.BYTES_PER_ELEMENT);
      // const positionIndex = allocator.alloc(Uint32Array, 1);
      // const faceIndex = allocator.alloc(Uint32Array, 1);
      const attributeRanges = allocator.alloc(Uint32Array, NUM_CHUNKS_HEIGHT * 6);
      const indexRanges = allocator.alloc(Uint32Array, NUM_CHUNKS_HEIGHT * 6);
      const colors = allocator.alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);

      self.LocalModule._doNoiserFill(
        noiserOffset,
        x,
        z,
        biomes.offset,
        elevations.offset,
        ethers.offset,
        water.offset,
        lava.offset,
        positions.offset,
        faces.offset,
        attributeRanges.offset,
        indexRanges.offset,
        colors.offset,
      );
      self.postMessage({
        result: {
          biomes,
          temperature,
          humidity,
          elevations,
          ethers,
          water,
          lava,
          positions,
          faces,
          attributeRanges,
          indexRanges,
          colors,
        },
      });
      allocator.freeAll();
      break;
    }
    case 'smoothedPotentials': {
      const allocator = new Allocator();

      const {chunkCoords: chunkCoordsArray, colorTargetCoordBuf: colorTargetCoordBufData, colorTargetSize, voxelSize, arrayBuffer} = data;

      const chunkCoords = allocator.alloc(Int32Array, chunkCoordsArray.length*3);
      for (let i = 0; i < chunkCoordsArray.length; i++) {
        const chunkCoord = chunkCoordsArray[i];
        chunkCoords[i*3] = chunkCoord[0];
        chunkCoords[i*3+1] = chunkCoord[1];
        chunkCoords[i*3+2] = chunkCoord[2];
      }
      const numChunkCoords = chunkCoordsArray.length;
      const colorTargetBuf = allocator.alloc(Float32Array, colorTargetCoordBufData.length);
      colorTargetBuf.set(colorTargetCoordBufData);
      const potentialsBlockSize = (width+1)*(height+1)*(depth+1);
      const potentialsBuffer = allocator.alloc(Float32Array, chunkCoordsArray.length*potentialsBlockSize);

      self.LocalModule._doSmoothedPotentials(
        chunkCoords.offset,
        numChunkCoords,
        colorTargetBuf.offset,
        colorTargetSize,
        voxelSize,
        potentialsBuffer.offset,
      );

      const potentialsArray = Array(chunkCoordsArray.length);
      let index = 0;
      for (let i = 0; i < chunkCoordsArray.length; i++) {
        const potentials = new Float32Array(arrayBuffer, index, potentialsBlockSize);
        potentials.set(potentialsBuffer.slice(i*potentialsBlockSize, (i+1)*potentialsBlockSize));
        index += potentialsBlockSize * Float32Array.BYTES_PER_ELEMENT;
        potentialsArray[i] = potentials;
      }
      self.postMessage({
        result: {
          potentialsArray,
          arrayBuffer,
        },
      }, [arrayBuffer]);
      allocator.freeAll();
      break;
    } */
    case 'march': {
      const allocator = new Allocator();

      const {dims: dimsData, potential: potentialData, brush: brushData, shift: shiftData, scale: scaleData, arrayBuffer} = data;
      const dims = allocator.alloc(Int32Array, 3);
      dims[0] = dimsData[0];
      dims[1] = dimsData[1];
      dims[2] = dimsData[2];
      const potential = allocator.alloc(Float32Array, potentialData.length);
      potential.set(potentialData);
      const brush = allocator.alloc(Uint8Array, brushData.length);
      brush.set(brushData);
      const shift = allocator.alloc(Float32Array, 3);
      shift[0] = shiftData[0];
      shift[1] = shiftData[1];
      shift[2] = shiftData[2];
      const scale = allocator.alloc(Float32Array, 3);
      scale[0] = scaleData[0];
      scale[1] = scaleData[1];
      scale[2] = scaleData[2];
      const positions = allocator.alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);
      const colors = allocator.alloc(Float32Array, 1024*1024/Uint8Array.BYTES_PER_ELEMENT);
      const faces = allocator.alloc(Uint32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);
      const positionIndex = allocator.alloc(Uint32Array, 1);
      const colorIndex = allocator.alloc(Uint32Array, 1);
      const faceIndex = allocator.alloc(Uint32Array, 1);
      self.Module._doMarchingCubes(
        dims.offset,
        potential.offset,
        brush.offset,
        shift.offset,
        scale.offset,
        positions.offset,
        colors.offset,
        faces.offset,
        positionIndex.offset,
        colorIndex.offset,
        faceIndex.offset
      );

      let index = 0;
      // console.log('got out positions', index, positionIndex[0], arrayBuffer.byteLength);
      const outPositions = new Float32Array(arrayBuffer, index, positionIndex[0]);
      outPositions.set(positions.slice(0, positionIndex[0]));
      index += positionIndex[0]*Float32Array.BYTES_PER_ELEMENT;
      const outColors = new Float32Array(arrayBuffer, index, colorIndex[0]);
      outColors.set(colors.slice(0, colorIndex[0]));
      index += colorIndex[0]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces = new Uint32Array(arrayBuffer, index, faceIndex[0]);
      outFaces.set(faces.slice(0, faceIndex[0]));
      // index += faceIndex[0]*Uint8Array.BYTES_PER_ELEMENT;

      self.postMessage({
        result: {
          positions: outPositions,
          colors: outColors,
          faces: outFaces,
          arrayBuffer,
        },
      }, [arrayBuffer]);
      allocator.freeAll();
      break;
    }
   /*  case 'computeGeometry': {
      const allocator = new Allocator();

      const {chunkCoords: chunkCoordsArray, colorTargetCoordBuf: colorTargetCoordBufData, colorTargetSize, voxelSize, marchCubesTexSize, marchCubesTexSquares, marchCubesTexTriangleSize, arrayBuffer} = data;

      const chunkCoords = allocator.alloc(Int32Array, chunkCoordsArray.length*3);
      for (let i = 0; i < chunkCoordsArray.length; i++) {
        const chunkCoord = chunkCoordsArray[i];
        chunkCoords[i*3] = chunkCoord[0];
        chunkCoords[i*3+1] = chunkCoord[1];
        chunkCoords[i*3+2] = chunkCoord[2];
      }
      const numChunkCoords = chunkCoordsArray.length;
      const colorTargetBuf = allocator.alloc(Float32Array, colorTargetCoordBufData.length);
      colorTargetBuf.set(colorTargetCoordBufData);
      const potentialsBlockSize = (width+1)*(height+1)*(depth+1);
      const potentialsBuffer = allocator.alloc(Float32Array, chunkCoordsArray.length*potentialsBlockSize);
      const positionsBuffer = allocator.alloc(Float32Array, chunkCoordsArray.length*300*1024/Float32Array.BYTES_PER_ELEMENT);
      const barycentricsBuffer = allocator.alloc(Float32Array, chunkCoordsArray.length*300*1024/Float32Array.BYTES_PER_ELEMENT);
      const uvsBuffer = allocator.alloc(Float32Array, chunkCoordsArray.length*300*1024/Float32Array.BYTES_PER_ELEMENT);
      const uvs2Buffer = allocator.alloc(Float32Array, chunkCoordsArray.length*300*1024/Float32Array.BYTES_PER_ELEMENT);
      const positionIndex = allocator.alloc(Uint32Array, chunkCoordsArray.length);
      const barycentricIndex = allocator.alloc(Uint32Array, chunkCoordsArray.length);
      const uvIndex = allocator.alloc(Uint32Array, chunkCoordsArray.length);
      const uvIndex2 = allocator.alloc(Uint32Array, chunkCoordsArray.length);

      self.LocalModule._doComputeGeometry(
        chunkCoords.offset,
        numChunkCoords,
        colorTargetBuf.offset,
        colorTargetSize,
        voxelSize,
        marchCubesTexSize,
        marchCubesTexSquares,
        marchCubesTexTriangleSize,
        potentialsBuffer.offset,
        positionsBuffer.offset,
        barycentricsBuffer.offset,
        uvsBuffer.offset,
        uvs2Buffer.offset,
        positionIndex.offset,
        barycentricIndex.offset,
        uvIndex.offset,
        uvIndex2.offset,
      );

      let index = 0;
      const potentialsArray = Array(chunkCoordsArray.length);
      for (let i = 0; i < chunkCoordsArray.length; i++) {
        const potentials = new Float32Array(arrayBuffer, index, potentialsBlockSize);
        potentials.set(potentialsBuffer.slice(i*potentialsBlockSize, (i+1)*potentialsBlockSize));
        index += potentialsBlockSize * Float32Array.BYTES_PER_ELEMENT;
        potentialsArray[i] = potentials;
      }
      const positionsArray = Array(chunkCoordsArray.length);
      let positionsBufferIndex = 0;
      const barycentricsArray = Array(chunkCoordsArray.length);
      let barycentricsBufferIndex = 0;
      const uvsArray = Array(chunkCoordsArray.length);
      let uvsBufferIndex = 0;
      const uvs2Array = Array(chunkCoordsArray.length);
      let uvs2BufferIndex = 0;
      for (let i = 0; i < chunkCoordsArray.length; i++) {
        const numPositions = positionIndex[i];
        const positions = new Float32Array(arrayBuffer, index, numPositions);
        positions.set(positionsBuffer.slice(positionsBufferIndex, positionsBufferIndex + numPositions));
        index += numPositions * Float32Array.BYTES_PER_ELEMENT;
        positionsBufferIndex += numPositions;
        positionsArray[i] = positions;

        const numBarycentrics = barycentricIndex[i];
        const barycentrics = new Float32Array(arrayBuffer, index, numBarycentrics);
        barycentrics.set(barycentricsBuffer.slice(barycentricsBufferIndex, barycentricsBufferIndex + numBarycentrics));
        index += numBarycentrics * Float32Array.BYTES_PER_ELEMENT;
        barycentricsBufferIndex += numBarycentrics;
        barycentricsArray[i] = barycentrics;

        const numUvs = uvIndex[i];
        const uvs = new Float32Array(arrayBuffer, index, numUvs);
        uvs.set(uvsBuffer.slice(uvsBufferIndex, uvsBufferIndex + numUvs));
        index += numUvs * Float32Array.BYTES_PER_ELEMENT;
        uvsBufferIndex += numUvs;
        uvsArray[i] = uvs;

        const numUvs2 = uvIndex2[i];
        const uvs2 = new Float32Array(arrayBuffer, index, numUvs2);
        uvs2.set(uvs2Buffer.slice(uvs2BufferIndex, uvs2BufferIndex + numUvs2));
        index += numUvs2 * Float32Array.BYTES_PER_ELEMENT;
        uvs2BufferIndex += numUvs2;
        uvs2Array[i] = uvs2;
      }

      self.postMessage({
        result: {
          potentialsArray,
          positionsArray,
          barycentricsArray,
          uvsArray,
          uvs2Array,
          arrayBuffer,
          size: index,
        },
      }, [arrayBuffer]);

      allocator.freeAll();

      break;
    } */
    case 'collide': {
      const allocator = new Allocator();

      const {positions: positionsData, origin: originData, direction: directionData} = data;

      const positions = allocator.alloc(Float32Array, positionsData.length);
      positions.set(positionsData);
      const origin = allocator.alloc(Float32Array, 3);
      origin[0] = originData[0];
      origin[1] = originData[1];
      origin[2] = originData[2];
      const direction = allocator.alloc(Float32Array, 3);
      direction[0] = directionData[0];
      direction[1] = directionData[1];
      direction[2] = directionData[2];
      const collision = allocator.alloc(Float32Array, 3);
      const collisionIndex = allocator.alloc(Uint32Array, 1);

      self.Module._doCollide(
        positions.offset,
        positions.length,
        origin.offset,
        direction.offset,
        collision.offset,
        collisionIndex.offset
      );

      self.postMessage({
        result: {
          collision: Float32Array.from([collision[0], collision[1], collision[2]]),
          collisionIndex: collisionIndex[0],
        },
      });

      allocator.freeAll();
      break;
    }
    case 'uvParameterize': {
      const allocator = new Allocator();

      const {positions: positionsData, normals: normalsData, faces: facesData, arrayBuffer} = data;

      const positions = allocator.alloc(Float32Array, positionsData.length);
      positions.set(positionsData);
      const normals = allocator.alloc(Float32Array, normalsData.length);
      normals.set(normalsData);
      const faces = allocator.alloc(Uint32Array, facesData.length);
      faces.set(facesData);
      const outPositions = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numOutPositions = allocator.alloc(Uint32Array, 1);
      const outNormals = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numOutNormals = allocator.alloc(Uint32Array, 1);
      const outFaces = allocator.alloc(Uint32Array, faces.length);
      const uvs = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numUvs = allocator.alloc(Uint32Array, 1);

      self.Module._doUvParameterize(
        positions.offset,
        positions.length,
        normals.offset,
        normals.length,
        faces.offset,
        faces.length,
        outPositions.offset,
        numOutPositions.offset,
        outNormals.offset,
        numOutNormals.offset,
        outFaces.offset,
        uvs.offset,
        numUvs.offset
      );

      let index = 0;
      const outPositions2 = new Float32Array(arrayBuffer, index, numOutPositions[0]);
      outPositions2.set(outPositions.slice(0, numOutPositions[0]));
      index += numOutPositions[0]*Float32Array.BYTES_PER_ELEMENT;
      const outNormals2 = new Float32Array(arrayBuffer, index, numOutNormals[0]);
      outNormals2.set(outNormals.slice(0, numOutNormals[0]));
      index += numOutNormals[0]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces2 = new Uint32Array(arrayBuffer, index, faces.length);
      outFaces2.set(outFaces.slice(0, faces.length));
      index += faces.length*Uint32Array.BYTES_PER_ELEMENT;
      const outUvs = new Float32Array(arrayBuffer, index, numUvs[0]);
      outUvs.set(uvs.slice(0, numUvs[0]));
      index += numUvs[0]*Float32Array.BYTES_PER_ELEMENT;

      self.postMessage({
        result: {
          positions: outPositions2,
          normals: outNormals2,
          faces: outFaces2,
          uvs: outUvs,
        },
      }, [arrayBuffer]);

      allocator.freeAll();
      break;
    }
    case 'cut': {
      const allocator = new Allocator();

      const {positions: positionsData, faces: facesData, position: positionData, quaternion: quaternionData, scale: scaleData, arrayBuffer} = data;

      const positions = allocator.alloc(Float32Array, positionsData.length);
      positions.set(positionsData);
      const faces = allocator.alloc(Uint32Array, facesData.length);
      faces.set(facesData);
      const position = allocator.alloc(Float32Array, 3);
      position.set(positionData);
      const quaternion = allocator.alloc(Float32Array, 4);
      quaternion.set(quaternionData);
      const scale = allocator.alloc(Float32Array, 3);
      scale.set(scaleData);

      const outPositions = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numOutPositions = allocator.alloc(Uint32Array, 2);
      const outFaces = allocator.alloc(Uint32Array, 300*1024/Uint32Array.BYTES_PER_ELEMENT);
      const numOutFaces = allocator.alloc(Uint32Array, 2);

      self.Module._doCut(
        positions.offset,
        positions.length,
        faces.offset,
        faces.length,
        position.offset,
        quaternion.offset,
        scale.offset,
        outPositions.offset,
        numOutPositions.offset,
        outFaces.offset,
        numOutFaces.offset
      );

      let index = 0;
      const outPositions2 = new Float32Array(arrayBuffer, index, numOutPositions[0]);
      outPositions2.set(outPositions.slice(0, numOutPositions[0]));
      index += numOutPositions[0]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces2 = new Uint32Array(arrayBuffer, index, numOutFaces[0]);
      outFaces2.set(outFaces.slice(0, numOutFaces[0]));
      index += numOutFaces[0]*Uint32Array.BYTES_PER_ELEMENT;

      const outPositions3 = new Float32Array(arrayBuffer, index, numOutPositions[1]);
      outPositions3.set(outPositions.slice(numOutPositions[0], numOutPositions[0] + numOutPositions[1]));
      index += numOutPositions[1]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces3 = new Uint32Array(arrayBuffer, index, numOutFaces[1]);
      outFaces3.set(outFaces.slice(numOutFaces[0], numOutFaces[0] + numOutFaces[1]));
      index += numOutFaces[1]*Uint32Array.BYTES_PER_ELEMENT;

      // console.log('worker positions', numOutPositions[0], numOutPositions[1], numOutFaces[0], numOutFaces[1], outPositions2, outFaces2, outPositions3, outFaces3);

      self.postMessage({
        result: {
          positions: outPositions2,
          faces: outFaces2,
          positions2: outPositions3,
          faces2: outFaces3,
        },
      }, [arrayBuffer]);

      allocator.freeAll();
      break;
    }
    default: {
      console.warn('unknown method', data.method);
      break;
    }
  }
};
const _flushMessages = () => {
  for (let i = 0; i < queue.length; i++) {
    _handleMessage(queue[i]);
  }
};
self.onmessage = e => {
  const {data} = e;
  if (!loaded) {
    queue.push(data);
  } else {
    _handleMessage(data);
  }
};
