<template>
  <div class="loader">
    <div class="loader-outter"></div>
    <div class="loader-inner"></div>
  </div>
  <!-- <span class="c-spinner"> 
    <span></span> 
    <span></span> 
    <span></span> 
  </span> -->
</template>

<style>
.loader {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  position: relative;
}

.loader-outter,
.loader-inner {
  position: absolute;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.loader-outter {
  border: 2px solid #A3EDFC;
  width: 100%;
  height: 100%;
  border-left-color: transparent;
  animation: rotate 1s cubic-bezier(0.15, 0.61, 0.58, 0.4) infinite;
}

.loader-inner {
  width: 82%;
  height: 82%;
  border: 2px solid #DF5A64;
  border-top-color: transparent;
  animation: rotate-reverse 1s cubic-bezier(0.15, 0.61, 0.58, 0.4) infinite;
}

@keyframes rotate {
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes rotate-reverse {
  100% {
    transform: translate(-50%, -50%) rotate(-360deg);
  }
}
</style>