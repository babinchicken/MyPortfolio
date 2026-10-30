import { useEffect, useRef, useState } from 'react'
import ProjectGallery from './molecules/ProjectGallery'

// Model and clip constants (using same glb for now, easily swappable later)
const MODEL_URL = '/walkwithme.glb'
const WALK_CLIP = 'Me_Walk'
const TURN_CLIP = 'Me_IdleTurn'
const IDLE_CLIP = 'Me_Idle'

function Hallway() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const galleryRef = useRef(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return undefined

    let disposed = false
    let cleanupScene = () => { }

    const loadScene = async () => {
      const [THREE, { GLTFLoader }] = await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
      ])
      if (disposed) return

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0xd7cebc, 0)

      const scene = new THREE.Scene()
      scene.background = null
      scene.add(new THREE.HemisphereLight(0xffefd8, 0x343b49, 2.2))

      const keyLight = new THREE.DirectionalLight(0xffe1b5, 3.2)
      keyLight.position.set(-5, 12, 8)
      scene.add(keyLight)

      const fillLight = new THREE.DirectionalLight(0x9caecb, 1.4)
      fillLight.position.set(6, 8, -8)
      scene.add(fillLight)

      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000)
      let cameraTarget = null
      let cameraDirection = null
      let modelBounds = null
      let modelGroup = null
      let mixer = null
      let idleAction = null
      let walkAction = null
      let turnAction = null
      let animationMode = 'uninitialized'
      let hasPlayedEntranceTurn = false
      let animationFrame = 0
      let previousFrameTime = 0
      let animationGeneration = 0

      const resize = () => {
        const { width, height } = canvas.getBoundingClientRect()
        if (!width || !height) return
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        if (cameraTarget && cameraDirection && modelBounds) {
          const forward = cameraDirection.clone().negate()
          const worldUp = new THREE.Vector3(0, 1, 0)
          const cameraRight = new THREE.Vector3().crossVectors(forward, worldUp).normalize()
          const cameraUp = new THREE.Vector3().crossVectors(cameraRight, forward).normalize()
          const halfVerticalFov = THREE.MathUtils.degToRad(camera.fov / 2)
          const halfHorizontalFov = Math.atan(Math.tan(halfVerticalFov) * camera.aspect)
          const horizontalLimit = Math.tan(halfHorizontalFov)
          const verticalLimit = Math.tan(halfVerticalFov)
          let frameDistance = 0

          for (const x of [modelBounds.min.x, modelBounds.max.x]) {
            for (const y of [modelBounds.min.y, modelBounds.max.y]) {
              for (const z of [modelBounds.min.z, modelBounds.max.z]) {
                const corner = new THREE.Vector3(x, y, z).sub(cameraTarget)
                const depth = corner.dot(cameraDirection)
                const horizontal = Math.abs(corner.dot(cameraRight)) / horizontalLimit
                const vertical = Math.abs(corner.dot(cameraUp)) / verticalLimit
                frameDistance = Math.max(frameDistance, depth + horizontal, depth + vertical)
              }
            }
          }

          camera.position.copy(cameraTarget).addScaledVector(cameraDirection, frameDistance * 0.6)
          camera.lookAt(cameraTarget)
        }
        renderer.render(scene, camera)
      }

      const renderFrame = () => renderer.render(scene, camera)

      const stopLiveAnimation = () => {
        animationGeneration += 1
        if (animationFrame) cancelAnimationFrame(animationFrame)
        animationFrame = 0
        previousFrameTime = 0
      }

      const startLiveAnimation = () => {
        if (animationFrame || disposed) return
        const generation = ++animationGeneration

        const animate = (time) => {
          if (generation !== animationGeneration || disposed) return
          animationFrame = 0
          if (disposed || animationMode === 'walk') return
          const delta = previousFrameTime ? Math.min((time - previousFrameTime) / 1000, 0.05) : 0
          previousFrameTime = time
          mixer?.update(delta)
          if (generation !== animationGeneration || disposed) return
          renderFrame()
          animationFrame = requestAnimationFrame(animate)
        }

        animationFrame = requestAnimationFrame(animate)
      }

      const playIdle = () => {
        if (!mixer || !idleAction || animationMode === 'idle') return
        stopLiveAnimation()
        idleAction.reset()
        idleAction.enabled = true
        idleAction.paused = false
        idleAction.setLoop(THREE.LoopRepeat, Infinity)
        idleAction.setEffectiveWeight(1)
        idleAction.play()
        walkAction?.stop()
        turnAction?.stop()
        animationMode = 'idle'
        previousFrameTime = 0
        startLiveAnimation()
      }

      const playWalk = (progress) => {
        if (!mixer || !walkAction) return
        stopLiveAnimation()

        if (animationMode !== 'walk') {
          idleAction?.stop()
          turnAction?.stop()
          walkAction.reset()
          walkAction.enabled = true
          walkAction.paused = true
          walkAction.setEffectiveWeight(1)
          walkAction.play()
          animationMode = 'walk'
        }

        walkAction.time = THREE.MathUtils.clamp(progress, 0, 1) * walkAction.getClip().duration
        mixer.update(0)
        renderFrame()
      }

      const playTurn = () => {
        if (!mixer || animationMode === 'turn') return
        if (!turnAction) {
          playIdle()
          return
        }
        stopLiveAnimation()
        idleAction?.stop()
        walkAction?.stop()
        turnAction.reset()
        turnAction.enabled = true
        turnAction.paused = false
        turnAction.setLoop(THREE.LoopOnce, 1)
        turnAction.clampWhenFinished = true
        turnAction.setEffectiveWeight(1)
        turnAction.play()
        animationMode = 'turn'
        previousFrameTime = 0
        startLiveAnimation()
      }

      const handleAnimationFinished = (event) => {
        if (event.action === turnAction && animationMode === 'turn') playIdle()
      }

      const TRANSITION_THRESHOLD = 0.35 // First 35% of scroll transitions GLB & background into view

      const updateScrollFrame = () => {
        const bounds = section.getBoundingClientRect()
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        // Reset entrance trigger if user scrolls back up toward the previous section
        if (bounds.top > window.innerHeight * 0.25) {
          hasPlayedEntranceTurn = false
        }

        if (bounds.top > window.innerHeight || bounds.bottom < 0) return

        const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight)
        const progress = THREE.MathUtils.clamp(-bounds.top / scrollableDistance, 0, 1)

        // Calculate transition progress along with scroll (0 to 1 over first 35% of hallway scroll)
        const transitionFactor = THREE.MathUtils.clamp(progress / TRANSITION_THRESHOLD, 0, 1)
        const easedTransition = reducedMotion
          ? 1
          : transitionFactor ** 2 * (3 - 2 * transitionFactor)

        if (modelGroup) {
          // GLB moves along with scroll from TOP (+2.8) down to BOTTOM (0.0 current position)
          modelGroup.position.y = 2.8 * (1 - easedTransition)

          // Background/model rotates about 45 degrees clockwise into place (Math.PI / 4 -> 0)
          modelGroup.rotation.y = (Math.PI / 4) * (1 - easedTransition)
        }

        // Gallery wall background rises from bottom up into current position
        galleryRef.current?.style.setProperty('--wall-enter', String(easedTransition))

        if (progress < TRANSITION_THRESHOLD) {
          // While transition is moving into place: keep character in idle
          if (animationMode === 'walk') {
            playIdle()
          } else if (animationMode === 'uninitialized') {
            playIdle()
          }
        } else {
          // Once transition completes into place: play turn if entering view for the first time
          if (!hasPlayedEntranceTurn) {
            hasPlayedEntranceTurn = true
            playTurn()
          }

          // Continue scrolling: scrub walk animation along with scroll
          const walkProgress = THREE.MathUtils.clamp(
            (progress - TRANSITION_THRESHOLD) / (1 - TRANSITION_THRESHOLD),
            0,
            1
          )
          playWalk(walkProgress)
        }

        renderFrame()
      }

      const loader = new GLTFLoader()
      loader.load(
        MODEL_URL,
        (gltf) => {
          if (disposed) return

          const modelScene = gltf.scenes.find((candidate) => candidate.name === 'Stairs_Environment')
            ?? gltf.scenes.find((candidate) => candidate.children.length > 0)
            ?? gltf.scene
          modelGroup = new THREE.Group()
          scene.add(modelGroup)
          modelGroup.add(modelScene)

          const bounds = new THREE.Box3().setFromObject(modelScene)
          const size = bounds.getSize(new THREE.Vector3())
          const center = bounds.getCenter(new THREE.Vector3())
          const largestDimension = Math.max(size.x, size.y, size.z)
          const scale = 3 / largestDimension
          modelScene.scale.setScalar(scale)
          modelScene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)

          const stairsMesh = modelScene.getObjectByName('Stairs')
          if (stairsMesh?.material?.name === 'Stair_Stone') {
            stairsMesh.material.color.set('#d7cebc')
            stairsMesh.material.roughness = 0.92
            stairsMesh.material.needsUpdate = true
          }

          const scaledSize = size.multiplyScalar(scale)
          const target = new THREE.Vector3(0, scaledSize.y * 0.48, 0)
          target.y += scaledSize.y * 0.38
          cameraTarget = target
          cameraDirection = new THREE.Vector3(1, 0, 0)

          modelGroup.updateMatrixWorld(true)
          modelBounds = new THREE.Box3().setFromObject(modelGroup)
          modelBounds.getCenter(cameraTarget)

          mixer = new THREE.AnimationMixer(modelScene)
          const clips = Object.fromEntries(gltf.animations.map((clip) => [clip.name, clip]))
          idleAction = clips[IDLE_CLIP] ? mixer.clipAction(clips[IDLE_CLIP]) : null
          walkAction = clips[WALK_CLIP] ? mixer.clipAction(clips[WALK_CLIP]) : null
          turnAction = clips[TURN_CLIP] ? mixer.clipAction(clips[TURN_CLIP]) : null
          mixer.addEventListener('finished', handleAnimationFinished)

          resize()
          updateScrollFrame()
        },
        undefined,
        () => {
          if (!disposed) setLoadError(true)
        },
      )

      const handleScroll = () => updateScrollFrame()
      window.addEventListener('resize', resize)
      window.addEventListener('scroll', handleScroll, { passive: true })
      resize()
      updateScrollFrame()

      cleanupScene = () => {
        window.removeEventListener('resize', resize)
        window.removeEventListener('scroll', handleScroll)
        stopLiveAnimation()
        mixer?.removeEventListener('finished', handleAnimationFinished)
        mixer?.stopAllAction()
        scene.traverse((object) => {
          if (!object.isMesh) return
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        })
        renderer.dispose()
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      loadScene().catch(() => {
        if (!disposed) setLoadError(true)
      })
    }, { rootMargin: '150% 0px' })

    observer.observe(section)

    return () => {
      disposed = true
      observer.disconnect()
      cleanupScene()
    }
  }, [])

  return (
    <section className="hallway-page" id="hallway">
      <div className="hallway-section" ref={sectionRef}>
        <div className="hallway-sticky">
          <ProjectGallery
            embedded
            galleryRef={galleryRef}
            id="hallway-projects"
            filterType="previous work"
            title="Selected professional & client work"
            eyebrow="Level 04 — Hallway"
            subtitle="Commercial platforms, mobile applications, and engineering projects."
          />
          <canvas
            className="hallway-canvas"
            ref={canvasRef}
            aria-label="A character walking through the hallway as you scroll"
          />
          <div className="hallway-heading">
            <p className="section-kicker">Level 04</p>
            <h2>Hallway</h2>
          </div>
          <a className="hallway-back" href="#staircase">Back to staircase</a>
          {loadError && <p className="hallway-error">The hallway scene could not be loaded.</p>}
          <span className="hallway-scroll-cue" aria-hidden="true">Scroll to proceed</span>
        </div>
      </div>
    </section>
  )
}

export default Hallway
