import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'

const UserAuth = ({ children }) => {

    const { user } = useContext(UserContext)
    const [ loading, setLoading ] = useState(true)
    const token = sessionStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        // Check token first (persists after refresh)
        if (!token) {
            navigate('/login')
            return
        }
        
        // If token exists, we're authenticated
        setLoading(false)
        
    }, [token, navigate])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <>
            {children}
        </>
    )
}

export default UserAuth