#sudo -u postgres createdb wikidb
auth=`cat auth.txt`;
auths=( $auth );
usr=${auths[0]};
pass=${auths[1]};
sudo -u postgres createdb bitvotedb;
sudo -u postgres psql -d bitvotedb -f setup/first_time_setup.psql -v usr_name=$usr -v password="'$pass'"
