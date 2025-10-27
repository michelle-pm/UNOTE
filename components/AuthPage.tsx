import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(email, password, rememberMe);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div 
            layout
            className="w-full max-w-sm bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/50 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8"
        >
            <h2 className="text-3xl font-bold text-center mb-2">{isLogin ? 'Вход' : 'Регистрация'}</h2>
            <p className="text-center text-light-text-secondary dark:text-dark-text/60 mb-8">
                {isLogin ? 'Добро пожаловать обратно!' : 'Создайте новый аккаунт'}
            </p>
        
            <form onSubmit={handleSubmit}>
                <AnimatePresence mode="popLayout">
                    {!isLogin && (
                        <motion.div
                            key="name"
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                        >
                            <label className="block text-sm font-medium mb-2" htmlFor="name">Имя</label>
                            <input 
                                id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors" 
                                required={!isLogin} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2" htmlFor="email">Email</label>
                    <input 
                        id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors" 
                        required 
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" htmlFor="password">Пароль</label>
                    <div className="relative">
                        <input 
                            id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-10" 
                            required 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <label htmlFor="rememberMe" className="flex items-center text-sm cursor-pointer select-none">
                        <input
                            id="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="ml-2 text-light-text-secondary dark:text-dark-text/80">Запомнить меня</span>
                    </label>
                </div>
                
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                
                <button type="submit" className="w-full p-3 bg-accent hover:bg-accent-dark text-dark-bg font-bold rounded-lg transition-colors">
                    {isLogin ? 'Войти' : 'Создать аккаунт'}
                </button>
            </form>

            <p className="text-center text-sm mt-8">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-bold text-accent hover:underline ml-2">
                    {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
            </p>
        </motion.div>
    </div>
  );
};

export default AuthPage;