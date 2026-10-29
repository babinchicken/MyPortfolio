import { useEffect, useRef, useState } from 'react'
import ProjectGallery from './molecules/ProjectGallery'

const MODEL_URL = '/stairsandgiril.glb'
const WALK_CLIP = 'Mixamo_StairsWalk'

function Staircase() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const [loadError, setLoadError] = useState(false)

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
    let walkAction = null

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

        camera.position.copy(cameraTarget).addScaledVector(cameraDirection, frameDistance * 1.08)
        camera.lookAt(cameraTarget)
      }
      renderer.render(scene, camera)
    }

    const updateScrollFrame = () => {
      const bounds = section.getBoundingClientRect()
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const entranceProgress = reducedMotion
        ? 1
        : THREE.MathUtils.clamp(1 - bounds.top / window.innerHeight, 0, 1)
      const easedEntrance = entranceProgress ** 2 * (3 - 2 * entranceProgress)

      if (modelGroup) {
        modelGroup.rotation.y = -Math.PI / 2 * (1 - easedEntrance)
        modelGroup.position.y = 1.6 * (1 - easedEntrance)
      }

      if (bounds.top > window.innerHeight || bounds.bottom < 0) return

      const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = THREE.MathUtils.clamp(-bounds.top / scrollableDistance, 0, 1)

      if (walkAction && mixer) {
        walkAction.time = progress * walkAction.getClip().duration
        mixer.update(0)
      }

      renderer.render(scene, camera)
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
        const scale = 8 / largestDimension
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
        const walkClip = gltf.animations.find((clip) => clip.name === WALK_CLIP)
          ?? gltf.animations.find((clip) => clip.name.toLowerCase().includes('stairs'))
          ?? gltf.animations[0]

        if (walkClip) {
          walkAction = mixer.clipAction(walkClip)
          walkAction.play()
          walkAction.paused = true
        }

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
    <section className="staircase-page" id="staircase">
      <div className="staircase-section" ref={sectionRef}>
        <div className="staircase-sticky">
          <ProjectGallery embedded />
          <canvas
            className="staircase-canvas"
            ref={canvasRef}
            aria-label="A character climbing the staircase as you scroll"
          />
          <div className="staircase-heading">
            <p className="section-kicker">Level 03</p>
            <h2>Upward</h2>
          </div>
          <a className="staircase-back" href="#explore">Back downstairs</a>
          {loadError && <p className="staircase-error">The staircase scene could not be loaded.</p>}
          <span className="staircase-scroll-cue" aria-hidden="true">Scroll to climb</span>
        </div>
      </div>
    </section>
  )
}

export default Staircase