import React from 'react';
import missionIMG from "../assets/mission.jpeg"; 
import { MISSION } from '../constants';
import demo from "../assets/demo_edited.mp4";

const Mission = () => {
  return (
    <section 
      id='mission' 
      className='scroll-mt-24' 
    >
        <div className='container mx-auto text-center'>
            <h2 className='mb-8 text-3xl lg:text-4xl'>Our Mission</h2>
            
            <div className='relative flex items-center justify-center'>
                
                {/* WRAPPER DIV: 
                   1. rounded-3xl: This creates the curved edges.
                   2. overflow-hidden: This cuts off the sharp corners of the video/overlay.
                */}
                <div className='relative rounded-3xl overflow-hidden'>
                    
                    <video 
                        className='w-full' 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        poster={missionIMG}
                    >
                        <source src={demo} type='video/mp4' />
                    </video>
                    
                    {/* Overlay */}
                    <div className='absolute top-0 left-0 h-full w-full bg-black/40'></div>
                    
                    {/* Text */}
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <p className='max-w-lg tracking-tighter text-white lg:text-3xl px-4'>
                            {MISSION}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    </section>
  )
}

export default Mission;