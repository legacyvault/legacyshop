<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\App;

class SetLocale
{
    public function handle($request, Closure $next)
    {
        if (session()->has('locale')) {
            App::setLocale(session('locale'));
        } else {
            $locale = substr($request->server('HTTP_ACCEPT_LANGUAGE'), 0, 2);

            if ($locale === 'en') {
                App::setLocale('en');
            } else {
                App::setLocale('id');
            }
        }

        return $next($request);
    }
}
