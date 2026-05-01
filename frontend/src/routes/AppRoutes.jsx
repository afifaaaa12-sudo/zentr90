import React from 'react'
import {Route , BrowserRouter , Routes, Navigate} from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

const AppRoutes = () => {
  return (
    <BrowserRouter>
    
<Routes>
    <Route path='/' element={<Navigate to='/login' />} />
    <Route path='/home' element={<UserAuth><Home/></UserAuth>} />
     <Route path='/login' element={<Login/>} />
     <Route path='/register' element={<Register/>} />
     <Route path='/project/:id' element={<UserAuth><Project/></UserAuth>}/>
</Routes>

    </BrowserRouter>
  )
}

export default AppRoutes
