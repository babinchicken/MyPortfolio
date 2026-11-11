import { useEffect, useRef } from 'react'

const MODEL_URL = '/walkwithme.glb'
const WALK_CLIP = 'Me_Walk'
const TURN_CLIP = 'Me_IdleTurn'
const IDLE_CLIP = 'Me_Idle'
const TRANSITION_THRESHOLD = 0.25

function CertificateCharacter({ sectionRef, onError }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return undefined

    let disposed = false
    let cleanupScene = () => {}

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
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
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

      const renderFrame = () => renderer.render(scene, camera)

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
          let frameDistance = 0

          for (const x of [modelBounds.min.x, modelBounds.max.x]) {
            for (const y of [modelBounds.min.y, modelBounds.max.y]) {
              for (const z of [modelBounds.min.z, modelBounds.max.z]) {
                const corner = new THREE.Vector3(x, y, z).sub(cameraTarget)
                const depth = corner.dot(cameraDirection)
                const horizontal = Math.abs(corner.dot(cameraRight)) / Math.tan(halfHorizontalFov)
                const vertical = Math.abs(corner.dot(cameraUp)) / Math.tan(halfVerticalFov)
                frameDistance = Math.max(frameDistance, depth + horizontal, depth + vertical)
              }
            }
          }

          camera.position.copy(cameraTarget).addScaledVector(cameraDirection, frameDistance * 0.6)
          camera.lookAt(cameraTarget)
        }
        renderFrame()
      }

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
          if (animationMode === 'walk') return
          const delta = previousFrameTime ? Math.min((time - previousFrameTime) / 1000, 0.05) : 0
          previousFrameTime = time
          mixer?.update(delta)
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
        if (!mixer || !turnAction || animationMode === 'turn') {
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
        startLiveAnimation()
      }

      const handleAnimationFinished = (event) => {
        if (event.action === turnAction && animationMode === 'turn') playIdle()
      }

      const updateScrollFrame = () => {
        const bounds = section.getBoundingClientRect()
        if (bounds.top > window.innerHeight || bounds.bottom < 0) return

        const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight)
        const progress = THREE.MathUtils.clamp(-bounds.top / scrollableDistance, 0, 1)
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const transitionProgress = reducedMotion
          ? 1
          : THREE.MathUtils.clamp(progress / TRANSITION_THRESHOLD, 0, 1)
        const easedTransition = transitionProgress ** 2 * (3 - 2 * transitionProgress)

        if (modelGroup) {
          modelGroup.position.y = 2.8 * (1 - easedTransition)
          modelGroup.rotation.y = (Math.PI / 4) * (1 - easedTransition)
        }
        if (bounds.top > window.innerHeight * 0.25) hasPlayedEntranceTurn = false

        if (progress < TRANSITION_THRESHOLD || reducedMotion) {
          if (animationMode === 'walk' || animationMode === 'uninitialized') playIdle()
        } else {
          if (!hasPlayedEntranceTurn) {
            hasPlayedEntranceTurn = true
            playTurn()
          } else {
            const walkProgress = THREE.MathUtils.clamp(
              (progress - TRANSITION_THRESHOLD) / (1 - TRANSITION_THRESHOLD),
              0,
              1,
            )
            playWalk(walkProgress)
          }
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
          const scale = 3 / Math.max(size.x, size.y, size.z)
          modelScene.scale.setScalar(scale)
          modelScene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)

          const scaledSize = size.multiplyScalar(scale)
          cameraTarget = new THREE.Vector3(0, scaledSize.y * 0.48, 0)
          cameraTarget.y += scaledSize.y * 0.38
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
          if (!disposed) onError()
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
        if (!disposed) onError()
      })
    }, { rootMargin: '150% 0px' })

    observer.observe(section)
    return () => {
      disposed = true
      observer.disconnect()
      cleanupScene()
    }
  }, [onError, sectionRef])

  return (
    <canvas
      className="certificate-canvas"
      ref={canvasRef}
      aria-label="A character walking through the certificate floor as you scroll"
    />
  )
}

export default CertificateCharacter
